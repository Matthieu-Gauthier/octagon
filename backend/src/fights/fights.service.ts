import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FightsService {
    constructor(private prisma: PrismaService) { }

    async updateResult(id: string, data: { winnerId?: string | null; method?: string | null; round?: number | null }) {
        // 1. Verify fight exists
        const fight = await this.prisma.fight.findUnique({ where: { id } });
        if (!fight) throw new NotFoundException('Fight not found');

        // Reset if no method is provided
        if (!data.method) {
            return this.prisma.fight.update({
                where: { id },
                data: {
                    winnerId: null,
                    method: null,
                    round: null,
                    status: 'SCHEDULED',
                },
            });
        }

        // 2. Validate input
        const isDrawOrNC = data.method === 'DRAW' || data.method === 'NC';
        if (!data.winnerId && !isDrawOrNC) {
            throw new BadRequestException('Winner is required (unless DRAW or NC)');
        }

        // 3. Update fight
        const updatedFight = await this.prisma.fight.update({
            where: { id },
            data: {
                winnerId: isDrawOrNC ? null : data.winnerId,
                method: data.method,
                round: data.round || null,
                status: 'FINISHED',
            },
        });

        // 4. Recalculate standings? 
        // Current architecture calculates standings on-the-fly via LeaguesService.findAll/getStandings
        // So we don't need to trigger anything here if we don't store standings in DB.

        return updatedFight;
    }
}
