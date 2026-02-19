import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BetsService {
    constructor(private prisma: PrismaService) { }

    async placeBet(
        userId: string,
        leagueId: string,
        fightId: string,
        data: { winnerId: string; method?: string; round?: number }
    ) {
        // 1. Fetch Fight & Event to check time
        const fight = await this.prisma.fight.findUnique({
            where: { id: fightId },
            include: { event: true },
        });
        if (!fight) throw new NotFoundException('Fight not found');

        // 2. Validate Time
        // Strict cutoff based on Event Date
        const now = new Date();
        if (now >= fight.event.date) {
            throw new BadRequestException('Betting is closed for this event');
        }

        // 3. Upsert Bet
        return this.prisma.bet.upsert({
            where: {
                leagueId_userId_fightId: {
                    leagueId,
                    userId,
                    fightId,
                },
            },
            update: {
                winnerId: data.winnerId,
                method: data.method,
                round: data.round,
            },
            create: {
                leagueId,
                userId,
                fightId,
                winnerId: data.winnerId,
                method: data.method,
                round: data.round,
            },
        });
    }

    async findMyBets(userId: string, leagueId: string) {
        return this.prisma.bet.findMany({
            where: { userId, leagueId },
        });
    }
}
