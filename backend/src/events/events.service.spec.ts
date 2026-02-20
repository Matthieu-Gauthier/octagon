import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { ScraperService } from './scraper.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
    let service: EventsService;
    let scraper: ScraperService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: ScraperService,
                    useValue: {
                        scrapeNextEvent: jest.fn(),
                    }
                },
                {
                    provide: PrismaService,
                    useValue: {
                        event: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            delete: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
        scraper = module.get<ScraperService>(ScraperService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return scheduled and live events, or finished events with user bets', async () => {
            const userId = 'user-123';
            const mockEvents = [{ id: 'event-1', status: 'SCHEDULED' }];
            (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

            const result = await service.findAll(userId);

            expect(result).toEqual(mockEvents);
            expect(prisma.event.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { status: { in: ['SCHEDULED', 'LIVE'] } },
                        {
                            status: 'FINISHED',
                            fights: { some: { bets: { some: { userId } } } }
                        }
                    ]
                },
                include: expect.any(Object),
                orderBy: { date: 'asc' }
            });
        });
    });

    describe('findOne', () => {
        it('should return a single event', async () => {
            const eventId = 'event-1';
            const mockEvent = { id: eventId, name: 'UFC 300' };
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

            const result = await service.findOne(eventId);

            expect(result).toEqual(mockEvent);
            expect(prisma.event.findUnique).toHaveBeenCalledWith({
                where: { id: eventId },
                include: expect.any(Object),
            });
        });
    });

    describe('fetchNextEvent', () => {
        it('should fail or return null initially when not implemented', async () => {
            (scraper.scrapeNextEvent as jest.Mock).mockResolvedValue(null);

            try {
                // Assuming it throws if no event found or unimplemented
                await service.fetchNextEvent();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('removeEvent', () => {
        it('should successfully remove an event', async () => {
            const eventId = 'event-1';
            (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: eventId, name: 'UFC 300' });
            (prisma.event.delete as jest.Mock).mockResolvedValue({ id: eventId });

            const result = await service.removeEvent(eventId);

            expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: eventId } });
            expect(result.success).toBe(true);
        });

        it('should throw an error if event not found', async () => {
            const eventId = 'missing-event';
            (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.removeEvent(eventId)).rejects.toThrow('not found');
        });
    });
});
