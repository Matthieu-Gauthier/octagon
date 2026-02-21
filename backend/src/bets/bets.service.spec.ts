import { Test, TestingModule } from '@nestjs/testing';
import { BetsService } from './bets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BetsService', () => {
    let service: BetsService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BetsService,
                {
                    provide: PrismaService,
                    useValue: {
                        fight: {
                            findUnique: jest.fn(),
                        },
                        bet: {
                            upsert: jest.fn(),
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            delete: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<BetsService>(BetsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    const future = (offsetMs = 24 * 60 * 60 * 1000) => new Date(Date.now() + offsetMs);
    const past = (offsetMs = 24 * 60 * 60 * 1000) => new Date(Date.now() - offsetMs);

    const userId = 'user-1';
    const leagueId = 'league-1';
    const fightId = 'fight-1';
    const betData = { winnerId: 'fighter-a' };

    const mockFight = (overrides: Partial<{
        isPrelim: boolean;
        isMainCard: boolean;
        status: string;
        eventDate: Date;
        prelimsStartAt: Date | null;
        mainCardStartAt: Date | null;
    }> = {}) => ({
        id: fightId,
        status: overrides.status ?? 'SCHEDULED',
        isPrelim: overrides.isPrelim ?? false,
        isMainCard: overrides.isMainCard ?? true,
        event: {
            date: overrides.eventDate ?? future(),
            prelimsStartAt: overrides.prelimsStartAt ?? null,
            mainCardStartAt: overrides.mainCardStartAt ?? null,
        },
    });

    // -------------------------------------------------------------------------
    // placeBet — NotFoundException
    // -------------------------------------------------------------------------
    describe('placeBet - fight not found', () => {
        it('should throw NotFoundException if fight does not exist', async () => {
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(NotFoundException);
        });
    });

    // -------------------------------------------------------------------------
    // placeBet — Prelim lock (US1) — T012-T016
    // -------------------------------------------------------------------------
    describe('placeBet - prelim fights (US1)', () => {
        it('T012: should accept bet on prelim fight when now < prelimsStartAt', async () => {
            const fight = mockFight({ isPrelim: true, prelimsStartAt: future() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);
            (prisma.bet.upsert as jest.Mock).mockResolvedValue({ id: 'bet-1', ...betData });

            const result = await service.placeBet(userId, leagueId, fightId, betData);
            expect(result).toBeDefined();
            expect(prisma.bet.upsert).toHaveBeenCalled();
        });

        it('T013: should throw BadRequestException for prelim fight when now >= prelimsStartAt', async () => {
            const fight = mockFight({ isPrelim: true, prelimsStartAt: past() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(BadRequestException);

            try {
                await service.placeBet(userId, leagueId, fightId, betData);
            } catch (e: any) {
                expect(e.message).toContain('preliminary card');
            }
        });

        it('T014: should accept bet on main card fight when prelims have started but mainCardStartAt is future', async () => {
            const fight = mockFight({
                isMainCard: true,
                isPrelim: false,
                prelimsStartAt: past(),      // prelims already started
                mainCardStartAt: future(),   // main card not yet started
            });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);
            (prisma.bet.upsert as jest.Mock).mockResolvedValue({ id: 'bet-1', ...betData });

            const result = await service.placeBet(userId, leagueId, fightId, betData);
            expect(result).toBeDefined();
        });

        it('T015: prelim fight with null prelimsStartAt and now < event.date → accepted (fallback)', async () => {
            const fight = mockFight({ isPrelim: true, prelimsStartAt: null, eventDate: future() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);
            (prisma.bet.upsert as jest.Mock).mockResolvedValue({ id: 'bet-1', ...betData });

            const result = await service.placeBet(userId, leagueId, fightId, betData);
            expect(result).toBeDefined();
        });

        it('T016: prelim fight with null prelimsStartAt and now >= event.date → BadRequestException (fallback)', async () => {
            const fight = mockFight({ isPrelim: true, prelimsStartAt: null, eventDate: past() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(BadRequestException);
        });
    });

    // -------------------------------------------------------------------------
    // placeBet — Main card lock (US2) — T019-T021
    // -------------------------------------------------------------------------
    describe('placeBet - main card fights (US2)', () => {
        it('T019: should accept bet on main card fight when now < mainCardStartAt', async () => {
            const fight = mockFight({ isMainCard: true, mainCardStartAt: future() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);
            (prisma.bet.upsert as jest.Mock).mockResolvedValue({ id: 'bet-1', ...betData });

            const result = await service.placeBet(userId, leagueId, fightId, betData);
            expect(result).toBeDefined();
        });

        it('T020: should throw BadRequestException for main card fight when now >= mainCardStartAt', async () => {
            const fight = mockFight({ isMainCard: true, mainCardStartAt: past() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(BadRequestException);

            try {
                await service.placeBet(userId, leagueId, fightId, betData);
            } catch (e: any) {
                expect(e.message).toContain('main card');
            }
        });

        it('T021: main card fight with null mainCardStartAt and now >= event.date → BadRequestException (fallback)', async () => {
            const fight = mockFight({ isMainCard: true, mainCardStartAt: null, eventDate: past() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(BadRequestException);
        });
    });

    // -------------------------------------------------------------------------
    // placeBet — Finished fight
    // -------------------------------------------------------------------------
    describe('placeBet - finished fight', () => {
        it('should throw BadRequestException for finished fight regardless of timestamps', async () => {
            const fight = mockFight({ status: 'FINISHED', mainCardStartAt: future() });
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(fight);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(BadRequestException);
        });
    });

    // -------------------------------------------------------------------------
    // findMyBets
    // -------------------------------------------------------------------------
    describe('findMyBets', () => {
        it('should return user bets for a league', async () => {
            const mockBets = [{ id: 'bet-1' }];
            (prisma.bet.findMany as jest.Mock).mockResolvedValue(mockBets);

            const result = await service.findMyBets('user-1', 'league-1');
            expect(result).toEqual(mockBets);
        });
    });
});
