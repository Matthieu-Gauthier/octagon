/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesService } from './leagues.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('LeaguesService', () => {
  let service: LeaguesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaguesService,
        {
          provide: PrismaService,
          useValue: {
            league: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            leagueMember: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LeaguesService>(LeaguesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a league', async () => {
      const leagueData = { name: 'My League', adminId: 'user-1' };
      const mockLeague = { id: 'league-1', ...leagueData };
      (prisma.league.create as jest.Mock).mockResolvedValue(mockLeague);

      const result = await service.create(leagueData as any);
      expect(result).toEqual(mockLeague);
    });
  });

  describe('join', () => {
    it('should add a member to the league if code is valid', async () => {
      const code = 'ABCDEF';
      const userId = 'user-2';
      const mockLeague = { id: 'league-1', code };
      (prisma.league.findUnique as jest.Mock).mockResolvedValue(mockLeague);
      (prisma.leagueMember.create as jest.Mock).mockResolvedValue({
        leagueId: 'league-1',
        userId,
      });

      await service.join(code, userId);

      expect(prisma.leagueMember.create).toHaveBeenCalledWith({
        data: { leagueId: 'league-1', userId, role: 'MEMBER' },
      });
    });

    it('should throw NotFoundException if code is invalid', async () => {
      (prisma.league.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.join('INVALID', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if already a member', async () => {
      const code = 'ABCDEF';
      const mockLeague = { id: 'league-1', code };
      (prisma.league.findUnique as jest.Mock).mockResolvedValue(mockLeague);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      (prisma.leagueMember.create as jest.Mock).mockRejectedValue(p2002Error);

      await expect(service.join(code, 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
