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
            {
              AND: [
                { date: { lte: expect.any(Date) } },
                { prelimsStartAt: null },
                { mainCardStartAt: null },
              ],
            },
          ],
        },
        data: { status: 'LIVE' },
      });
    });

    // T020: updated — UFCStats URL expected, event mock includes ufcstatsId
    it('should fetch UFCStats event page for LIVE events that have ufcstatsId', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mock-event-1',
          ufcstatsId: 'abc123ufcstatsid',
          fights: [],
        },
      ]);

      await service.handleLiveEvents();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://ufcstats.com/event-details/abc123ufcstatsid',
        expect.any(Object),
      );
    });

    // T021: skip event when ufcstatsId is null
    it('should skip event and not call fetch when ufcstatsId is null', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mock-event-no-ufcstats',
          ufcstatsId: null,
          fights: [],
        },
      ]);

      await service.handleLiveEvents();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should transition event to FINISHED if all fights are finished', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mock-event-1',
          ufcstatsId: 'abc123ufcstatsid',
          fights: [
            {
              id: 'fight-1',
              status: 'FINISHED',
              ufcstatsId: 'fight-ufcstats-id',
              fighterA: { id: 'fighter-a', ufcstatsId: 'fa-id' },
              fighterB: { id: 'fighter-b', ufcstatsId: 'fb-id' },
            },
          ],
        },
      ]);

      await service.handleLiveEvents();

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'mock-event-1' },
        data: { status: 'FINISHED' },
      });
    });

    it('should catch errors and not crash the process', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));

      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mock-event-1',
          ufcstatsId: 'abc123ufcstatsid',
          fights: [],
        },
      ]);

      await expect(service.handleLiveEvents()).resolves.not.toThrow();
    });
  });
});
