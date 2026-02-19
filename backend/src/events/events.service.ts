import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.event.findMany({
            where: {
                OR: [
                    { status: { in: ['SCHEDULED', 'LIVE'] } },
                    {
                        status: 'FINISHED',
                        fights: { some: { bets: { some: { userId } } } }
                    }
                ]
            },
            include: {
                fights: {
                    include: {
                        fighterA: true,
                        fighterB: true,
                    },
                    orderBy: [{ isMainEvent: 'desc' }, { isCoMainEvent: 'desc' }, { isMainCard: 'desc' }]
                }
            },
            orderBy: { date: 'asc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.event.findUnique({
            where: { id },
            include: {
                fights: {
                    include: { fighterA: true, fighterB: true },
                    orderBy: [{ isMainEvent: 'desc' }, { isCoMainEvent: 'desc' }, { isMainCard: 'desc' }]
                }
            }
        });
    }
}
