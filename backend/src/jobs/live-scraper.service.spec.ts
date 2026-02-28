/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { LiveScraperService } from './live-scraper.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LiveScraperService', () => {
  let service: LiveScraperService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveScraperService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              updateMany: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            fight: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LiveScraperService>(LiveScraperService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html>Mock html</html>'),
      }),
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleLiveEvents', () => {
    it('should transition SCHEDULED events to LIVE if start time has passed', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]); // No live events

      await service.handleLiveEvents();

      expect(prisma.event.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'SCHEDULED',
          OR: [
            { prelimsStartAt: { lte: expect.any(Date) } },
            { mainCardStartAt: { lte: expect.any(Date) } },
          ],
        },
        data: { status: 'LIVE' },
      });
    });

    it('should fetch LIVE events and attempt to scrape them', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        { id: 'mock-event-1', fights: [] },
      ]);

      await service.handleLiveEvents();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.ufc.com/event/mock-event-1',
        expect.any(Object),
      );
    });

    it('should transition event to FINISHED if all fights are finished', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mock-event-1',
          fights: [{ id: 'fight-1', status: 'FINISHED' }],
        },
      ]);

      await service.handleLiveEvents();

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'mock-event-1' },
        data: { status: 'FINISHED' },
      });
    });

    it('should catch scaling errors and not crash the process', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));

      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        { id: 'mock-event-1', fights: [] },
      ]);

      await expect(service.handleLiveEvents()).resolves.not.toThrow();
    });
  });
});
