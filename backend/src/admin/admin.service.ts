import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async setFightResult(fightId: string, result: { winnerId: string; method: string; round?: number; time?: string }) {
        const fight = await this.prisma.fight.update({
            where: { id: fightId },
            data: {
                status: 'FINISHED',
                winnerId: result.winnerId,
                method: result.method,
                round: result.round,
                time: result.time,
            },
        });

        // Trigger standings calculation logic here (or via event emitter)
        // For MVP, we might just calculate on read or trigger a simple update function.
        // Given "Backend calculation triggered by fight results", we should ideally update Leaderboard or Points.
        // However, our data model calculates points on the fly or we need a Standings service.
        // Spec said: "Standings... Calculated based on official results."
        // If we calculate on-the-fly in `GET /standings`, we don't need to store anything here.
        return fight;
    }

    async archiveLeague(leagueId: string) {
        return this.prisma.league.update({
            where: { id: leagueId },
            data: { isArchived: true },
        });
    }
}
