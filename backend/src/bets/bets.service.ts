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

        // 2. Validate Time & Status
        // Strict cutoff based on Event Date OR Fight Status
        const now = new Date();
        if (now >= fight.event.date) {
            throw new BadRequestException('Betting is closed for this event');
        }
        if (fight.status === 'FINISHED') {
            throw new BadRequestException('Betting is closed for this fight');
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

    async findLeagueBets(leagueId: string, userId: string) {
        return this.prisma.bet.findMany({ where: { leagueId, userId } });
    }

    async remove(betId: string, userId: string) {
        // Ensure bet exists and belongs to user
        const bet = await this.prisma.bet.findUnique({
            where: { id: betId },
            include: { fight: true } // Include fight to check status
        });
        if (!bet) throw new NotFoundException('Bet not found');
        if (bet.userId !== userId) throw new BadRequestException('You can only remove your own bets');

        // Check if fight is finished
        if (bet.fight.status === 'FINISHED') {
            throw new BadRequestException('Cannot remove bet for finished fight');
        }

        return this.prisma.bet.delete({ where: { id: betId } });
    }
}
