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

    describe('placeBet', () => {
        const userId = 'user-1';
        const leagueId = 'league-1';
        const fightId = 'fight-1';
        const betData = { winnerId: 'fighter-a' };

        it('should place a bet if fight exists and time is valid', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const mockFight = { id: fightId, event: { date: futureDate } };

            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(mockFight);
            (prisma.bet.upsert as jest.Mock).mockResolvedValue({ id: 'bet-1', ...betData });

            const result = await service.placeBet(userId, leagueId, fightId, betData);

            expect(result).toBeDefined();
            expect(prisma.bet.upsert).toHaveBeenCalled();
        });

        it('should throw NotFoundException if fight does not exist', async () => {
            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if betting is closed', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const mockFight = { id: fightId, event: { date: pastDate } };

            (prisma.fight.findUnique as jest.Mock).mockResolvedValue(mockFight);

            await expect(service.placeBet(userId, leagueId, fightId, betData))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findMyBets', () => {
        it('should return user bets for a league', async () => {
            const mockBets = [{ id: 'bet-1' }];
            (prisma.bet.findMany as jest.Mock).mockResolvedValue(mockBets);

            const result = await service.findMyBets('user-1', 'league-1');
            expect(result).toEqual(mockBets);
        });
    });
});
