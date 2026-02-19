import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaguesService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.LeagueUncheckedCreateInput) {
        return this.prisma.league.create({ data });
    }

    async findAll() {
        return this.prisma.league.findMany({
            where: { isArchived: false },
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

    async join(code: string, userId: string) {
        const league = await this.prisma.league.findUnique({ where: { code } });
        if (!league) throw new NotFoundException('Invalid league code');

        try {
            return await this.prisma.leagueMember.create({
                data: {
                    leagueId: league.id,
                    userId,
                    role: 'MEMBER',
                },
            });
        } catch (e) {
            if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') throw new BadRequestException('Already a member');
            throw e;
        }
    }

    async getStandings(leagueId: string) {
        const league = await this.prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                // scoringSettings is JSON, so we just access it. No explicit include needed if it's a field, but check Prisma behavior.
                // Wait, JSON fields are included by default.
                members: {
                    include: {
                        user: true,
                    }
                },
                bets: {
                    include: {
                        fight: true,
                    }
                }
            }
        });

        if (!league) throw new NotFoundException('League not found');

        const settings = league.scoringSettings as any; // { winner: 10, method: 5, round: 5 }

        // Group bets by user
        const betsByUser = new Map<string, any[]>();
        league.bets.forEach(bet => {
            if (!betsByUser.has(bet.userId)) betsByUser.set(bet.userId, []);
            betsByUser.get(bet.userId)!.push(bet);
        });

        // Calculate points
        const standings = league.members.map(member => {
            const userBets = betsByUser.get(member.userId) || [];
            let points = 0;
            let perfectPicks = 0;
            let betsPlaced = 0;

            for (const bet of userBets) {
                const fight = bet.fight;
                if (fight.status === 'FINISHED' && fight.winnerId) {
                    betsPlaced++;

                    // Check Winner
                    if (bet.winnerId === fight.winnerId) {
                        points += (settings.winner || 10);

                        // Check Method
                        let methodCorrect = false;
                        if (bet.method && fight.method && bet.method === fight.method) {
                            points += (settings.method || 5);
                            methodCorrect = true;
                        }

                        // Check Round
                        let roundCorrect = false;
                        if (bet.round && fight.round && bet.round === fight.round) {
                            points += (settings.round || 5); // Assuming default 5 if missing setting, but JSON default is there
                            roundCorrect = true;
                        }

                        if (methodCorrect && roundCorrect) perfectPicks++;
                    }
                }
            }

            return {
                userId: member.userId,
                username: member.user.username,
                points,
                betsPlaced,
                perfectPicks,
                rank: 0,
            };
        });

        // Sort by points desc
        standings.sort((a, b) => b.points - a.points);

        // Assign Ranks
        standings.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return standings;
    }
}
