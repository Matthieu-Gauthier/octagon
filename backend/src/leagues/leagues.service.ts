import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Bet, Fight, Event } from '@prisma/client';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Prisma.LeagueUncheckedCreateInput & { adminEmail?: string },
  ) {
    // Ensure admin user exists in local DB
    const { adminId, adminEmail } = data;

    if (adminId && adminEmail) {
      await this.prisma.user.upsert({
        where: { id: adminId },
        update: {}, // No update needed if exists
        create: {
          id: adminId,
          email: adminEmail,
          username: adminEmail.split('@')[0], // Fallback username
        },
      });
    }

    // Remove helper fields that are not in League model
    delete data.adminEmail;

    // Generate unique code if not provided
    if (!data.code) {
      data.code = await this.generateUniqueCode();
    }
    return this.prisma.league.create({ data });
  }

  private async generateUniqueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }

      const existing = await this.prisma.league.findUnique({ where: { code } });
      if (!existing) isUnique = true;
    }
    return code;
  }

  async findAll(userId: string) {
    return this.prisma.league.findMany({
      where: {
        isArchived: false,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: { admin: true, _count: { select: { members: true } } },
    });
  }

  async findOne(id: string) {
    const league = await this.prisma.league.findUnique({
      where: { id },
      include: {
        admin: true,
        members: { include: { user: true } },
      },
    });
    if (!league) throw new NotFoundException(`League with ID ${id} not found`);
    return league;
  }

  async update(id: string, data: Prisma.LeagueUncheckedUpdateInput) {
    return this.prisma.league.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.league.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async join(code: string, userId: string, email?: string) {
    const league = await this.prisma.league.findUnique({ where: { code } });
    if (!league) throw new NotFoundException('Invalid league code');

    // Ensure user exists
    if (email) {
      await this.prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: email,
          username: email.split('@')[0],
        },
      });
    }

    try {
      return await this.prisma.leagueMember.create({
        data: {
          leagueId: league.id,
          userId,
          role: 'MEMBER',
        },
      });
    } catch (e) {
      if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002')
        throw new BadRequestException('Already a member');
      throw e;
    }
  }

  async getStandings(leagueId: string, eventId?: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        members: { include: { user: true } },
        bets: {
          include: {
            fight: { include: { event: true } },
          },
        },
      },
    });

    if (!league) throw new NotFoundException('League not found');

    // Determine current event
    let currentEventId: string | null = eventId ?? null;
    if (!currentEventId) {
      const eventMap = new Map<string, { id: string; status: string; date: Date }>();
      for (const bet of league.bets) {
        const ev = bet.fight.event;
        if (!eventMap.has(ev.id))
          eventMap.set(ev.id, { id: ev.id, status: ev.status, date: new Date(ev.date) });
      }
      if (eventMap.size > 0) {
        const events = Array.from(eventMap.values());
        const live = events.find((e) => e.status === 'LIVE');
        if (live) {
          currentEventId = live.id;
        } else {
          events.sort((a, b) => b.date.getTime() - a.date.getTime());
          currentEventId = events[0].id;
        }
      }
    }

    const defaultSettings = { winner: 10, method: 5, round: 5, decision: 0 };
    const settings = { ...defaultSettings, ...((league.scoringSettings as object) || {}) } as typeof defaultSettings;

    // Fetch atouts for this event
    const atouts = currentEventId
      ? await this.prisma.atout.findMany({ where: { leagueId, eventId: currentEventId } })
      : [];

    // Build lookup: userId → fightId → bet (restricted to current event)
    type BetWithFight = Bet & { fight: Fight & { event: Event } };
    const betsByUser = new Map<string, BetWithFight[]>();
    const allBetsIndex = new Map<string, Map<string, BetWithFight>>(); // userId → fightId → bet

    for (const bet of league.bets) {
      if (currentEventId && bet.fight.eventId !== currentEventId) continue;
      if (!betsByUser.has(bet.userId)) betsByUser.set(bet.userId, []);
      betsByUser.get(bet.userId)!.push(bet);
      if (!allBetsIndex.has(bet.userId)) allBetsIndex.set(bet.userId, new Map());
      allBetsIndex.get(bet.userId)!.set(bet.fightId, bet);
    }

    // Compute fight points for a bet (with optional inverted winnerId)
    const calcBetPoints = (
      fight: Fight,
      winnerId: string,
      method: string | null,
      round: number | null,
    ) => {
      if (winnerId !== fight.winnerId) return { points: 0, correct: false, perfect: false };
      let pts = settings.winner;
      let methodCorrect = false;
      if (method && fight.method && method === fight.method) {
        pts += settings.method;
        methodCorrect = true;
      }
      const isDecision = method === 'DECISION' || method === 'DRAW';
      let roundCorrect = false;
      if (methodCorrect) {
        if (isDecision) {
          pts += settings.decision ?? 0;
        } else if (round && fight.round && round === fight.round) {
          pts += settings.round;
          roundCorrect = true;
        }
      }
      return {
        points: pts,
        correct: true,
        perfect: methodCorrect && (roundCorrect || isDecision),
      };
    };

    // Get the effective winnerId for a user's bet after INVERSION
    const getEffectiveWinnerId = (bet: BetWithFight, fight: Fight, userId: string): string => {
      const inv = atouts.find(
        (a) => a.type === 'INVERSION' && a.targetUserId === userId && a.fightId === fight.id,
      );
      if (!inv) return bet.winnerId;
      return bet.winnerId === fight.fighterAId ? fight.fighterBId : fight.fighterAId;
    };

    // Build standings with atout effects — exclude members with no bets on this event
    const standings = league.members
      .filter((member) => (betsByUser.get(member.userId) || []).length > 0)
      .map((member) => {
      const userId = member.userId;
      const userBets = betsByUser.get(userId) || [];
      let points = 0;
      let perfectPicks = 0;
      let betsPlaced = 0;
      let correctWinners = 0;

      for (const bet of userBets) {
        const fight = bet.fight;
        if (fight.status !== 'FINISHED' || !fight.winnerId) continue;
        betsPlaced++;

        // DETTE: target gets 0
        const dette = atouts.find(
          (a) => a.type === 'DETTE' && a.targetUserId === userId && a.fightId === fight.id,
        );
        if (dette) continue;

        // Apply INVERSION
        const effectiveWinnerId = getEffectiveWinnerId(bet, fight, userId);
        const { points: fightPts, correct, perfect } = calcBetPoints(
          fight, effectiveWinnerId, bet.method, bet.round,
        );

        if (correct) correctWinners++;
        if (perfect) perfectPicks++;

        // DOUBLE: multiply
        const double = atouts.find(
          (a) => a.type === 'DOUBLE' && a.playedByUserId === userId && a.fightId === fight.id,
        );
        points += double ? fightPts * 2 : fightPts;
      }

      // DETTE bonus: add stolen points
      for (const atout of atouts) {
        if (atout.type !== 'DETTE' || atout.playedByUserId !== userId || !atout.targetUserId) continue;
        const targetBet = allBetsIndex.get(atout.targetUserId)?.get(atout.fightId);
        if (!targetBet) continue;
        const fight = targetBet.fight;
        if (fight.status !== 'FINISHED' || !fight.winnerId) continue;

        const effectiveWinnerId = getEffectiveWinnerId(targetBet, fight, atout.targetUserId);
        const { points: stolen } = calcBetPoints(fight, effectiveWinnerId, targetBet.method, targetBet.round);
        // If the target had DOUBLE on this fight, the stolen points are also doubled
        const targetDouble = atouts.find(
          (a) => a.type === 'DOUBLE' && a.playedByUserId === atout.targetUserId && a.fightId === fight.id,
        );
        points += targetDouble ? stolen * 2 : stolen;
      }

      return {
        userId,
        username: member.user.username,
        points,
        correct: correctWinners,
        total: betsPlaced,
        betsPlaced,
        perfectPicks,
        rank: 0,
      };
    });

    standings.sort((a, b) => b.points - a.points);
    standings.forEach((entry, i) => { entry.rank = i + 1; });
    return standings;
  }
}
