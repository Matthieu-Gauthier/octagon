import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
    let service: EventsService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                {
                    provide: PrismaService,
                    useValue: {
                        event: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<EventsService>(EventsService);
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
});
