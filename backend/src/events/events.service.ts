import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperService } from './scraper.service';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        private prisma: PrismaService,
        private scraper: ScraperService
    ) { }

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

    async fetchNextEvent() {
        this.logger.log('Executing fetchNextEvent request...');
        const scrapedData = await this.scraper.scrapeNextEvent();

        if (!scrapedData) {
            throw new NotFoundException('Failed to scrape upcoming event from the source.');
        }

        const { event, fights, fighters } = scrapedData;

        // Upsert Event
        await this.prisma.event.upsert({
            where: { id: event.id },
            update: {
                name: event.name,
                date: event.date,
                location: event.location,
                status: event.status,
                prelimsStartAt: event.prelimsStartAt ?? null,
                mainCardStartAt: event.mainCardStartAt ?? null,
            },
            create: event,
        });

        // Upsert Fighters
        let fightersUpdated = 0;
        for (const fighter of fighters) {
            await this.prisma.fighter.upsert({
                where: { id: fighter.id },
                update: {
                    wins: fighter.wins,
                    losses: fighter.losses,
                    draws: fighter.draws,
                    noContests: fighter.noContests,
                    winsByKo: fighter.winsByKo,
                    winsBySub: fighter.winsBySub,
                    winsByDec: fighter.winsByDec,
                    height: fighter.height,
                    weight: fighter.weight,
                    reach: fighter.reach,
                    stance: fighter.stance,
                    sigStrikesLandedPerMin: fighter.sigStrikesLandedPerMin,
                    takedownAvg: fighter.takedownAvg,
                    // Only overwrite imagePath if not null, or always overwrite
                    ...(fighter.imagePath ? { imagePath: fighter.imagePath } : {}),
                },
                create: fighter,
            });
            fightersUpdated++;
        }

        // Upsert Fights
        let fightsAdded = 0;
        for (const fight of fights) {
            await this.prisma.fight.upsert({
                where: { id: fight.id },
                update: {
                    division: fight.division,
                    rounds: fight.rounds,
                    isMainEvent: fight.isMainEvent,
                    isCoMainEvent: fight.isCoMainEvent,
                    isMainCard: fight.isMainCard,
                    isPrelim: fight.isPrelim,
                    status: fight.status,
                },
                create: {
                    ...fight,
                    eventId: event.id,
                },
            });
            fightsAdded++;
        }

        return {
            success: true,
            message: `Successfully imported ${event.name}`,
            data: {
                event: {
                    id: event.id,
                    name: event.name,
                    date: event.date
                },
                stats: {
                    fightersAddedOrUpdated: fightersUpdated,
                    fightsAdded,
                }
            }
        };
    }

    async removeEvent(id: string) {
        // Find if event exists to provide a clean 404 if not
        const event = await this.prisma.event.findUnique({
            where: { id }
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found.`);
        }

        // Delete event (relations cascade)
        await this.prisma.event.delete({
            where: { id }
        });

        return { success: true, message: `Event ${event.name} removed successfully.` };
    }
}
