import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AtoutsService {
  constructor(private prisma: PrismaService) {}

  async play(
    userId: string,
    data: {
      leagueId: string;
      eventId: string;
      fightId: string;
      type: string;
      playedByName: string;
      targetUserId?: string;
      targetUserName?: string;
    },
  ) {
    // Verify fight exists and is not finished
    const fight = await this.prisma.fight.findUnique({ where: { id: data.fightId } });
    if (!fight) throw new NotFoundException('Fight not found');
    if (fight.status === 'FINISHED') throw new BadRequestException('Cannot play atout on a finished fight');

    // Upsert — one atout per user per event per league
    return this.prisma.atout.upsert({
      where: {
        leagueId_eventId_playedByUserId: {
          leagueId: data.leagueId,
          eventId: data.eventId,
          playedByUserId: userId,
        },
      },
      update: {
        fightId: data.fightId,
        type: data.type,
        playedByName: data.playedByName,
        targetUserId: data.targetUserId ?? null,
        targetUserName: data.targetUserName ?? null,
        playedAt: new Date(),
      },
      create: {
        leagueId: data.leagueId,
        eventId: data.eventId,
        fightId: data.fightId,
        type: data.type,
        playedByUserId: userId,
        playedByName: data.playedByName,
        targetUserId: data.targetUserId ?? null,
        targetUserName: data.targetUserName ?? null,
      },
    });
  }

  async findByLeagueAndEvent(leagueId: string, eventId: string) {
    return this.prisma.atout.findMany({ where: { leagueId, eventId } });
  }

  async remove(id: string, userId: string) {
    const atout = await this.prisma.atout.findUnique({
      where: { id },
      include: { league: false },
    });
    if (!atout) throw new NotFoundException('Atout not found');
    if (atout.playedByUserId !== userId) throw new ForbiddenException('Not your atout');

    // Check the fight is not finished
    const fight = await this.prisma.fight.findUnique({ where: { id: atout.fightId } });
    if (fight?.status === 'FINISHED') throw new BadRequestException('Cannot remove atout on a finished fight');

    return this.prisma.atout.delete({ where: { id } });
  }
}
