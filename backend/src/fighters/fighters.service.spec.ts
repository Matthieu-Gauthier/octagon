import { Test, TestingModule } from '@nestjs/testing';
import { FightersService } from './fighters.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FightersService', () => {
  let service: FightersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FightersService,
        {
          provide: PrismaService,
          useValue: {
            fighter: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FightersService>(FightersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of fighters', async () => {
      const mockFighters = [{ id: 'jon-jones', name: 'Jon Jones' }];
      (prisma.fighter.findMany as jest.Mock).mockResolvedValue(mockFighters);

      const result = await service.findAll();
      expect(result).toEqual(mockFighters);
    });
  });

  describe('findOne', () => {
    it('should return a single fighter', async () => {
      const mockFighter = { id: 'jon-jones', name: 'Jon Jones' };
      (prisma.fighter.findUnique as jest.Mock).mockResolvedValue(mockFighter);

      const result = await service.findOne('jon-jones');
      expect(result).toEqual(mockFighter);
    });

    it('should throw NotFoundException if fighter does not exist', async () => {
      (prisma.fighter.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
