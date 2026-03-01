import { Test, TestingModule } from '@nestjs/testing';
import {
  UfcstatsEnrichmentService,
  EnrichmentResult,
} from './ufcstats-enrichment.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock HTML fixtures ────────────────────────────────────────────────────

const MOCK_EVENTS_HTML = `
<html><body>
  <a href="/event-details/abc123">UFC 326: Holloway vs. Oliveira 2</a>
</body></html>
`;

const MOCK_EVENT_DETAIL_HTML = `
<html><body>
  <a href="/fighter-details/fid-holloway">Max Holloway</a>
  <a href="/fighter-details/fid-oliveira">Charles Oliveira</a>
  <table>
    <tbody>
      <tr data-link="http://ufcstats.com/fight-details/fight-001">
        <td></td>
        <td>
          <a href="/fighter-details/fid-holloway">Max Holloway</a>
          <a href="/fighter-details/fid-oliveira">Charles Oliveira</a>
        </td>
        <td></td><td></td><td></td><td></td><td></td>
        <td>KO/TKO</td><td>3</td><td>2:54</td>
      </tr>
    </tbody>
  </table>
</body></html>
`;

// ─── Prisma mock ───────────────────────────────────────────────────────────

const mockPrisma = {
  event: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  fighter: {
    update: jest.fn(),
  },
  fight: {
    update: jest.fn(),
  },
};

// ─── Module setup ─────────────────────────────────────────────────────────

describe('UfcstatsEnrichmentService', () => {
  let service: UfcstatsEnrichmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UfcstatsEnrichmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UfcstatsEnrichmentService>(UfcstatsEnrichmentService);

    // Mock fetch globally
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ─── T007: service instantiation ─────────────────────────────────────────

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── T008: enrichEvent happy path ─────────────────────────────────────────

  describe('enrichEvent()', () => {
    it('should populate ufcstatsId on event, fighters, and fights', async () => {
      // Mock DB event with two fighters
      mockPrisma.event.findUnique.mockResolvedValue({
        id: 'ufc-326',
        name: 'UFC 326',
        fights: [
          {
            id: 'holloway-vs-oliveira',
            fighterAId: 'max-holloway',
            fighterBId: 'charles-oliveira',
            fighterA: { id: 'max-holloway', name: 'Max Holloway' },
            fighterB: { id: 'charles-oliveira', name: 'Charles Oliveira' },
          },
        ],
      });

      // Persistent mock: route by URL (avoids ordering issues with sequential calls)
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const html = String(url).includes('/statistics/events/')
          ? MOCK_EVENTS_HTML
          : MOCK_EVENT_DETAIL_HTML;
        return Promise.resolve({ ok: true, text: () => Promise.resolve(html) });
      });

      mockPrisma.fighter.update.mockResolvedValue({});
      mockPrisma.fight.update.mockResolvedValue({});
      mockPrisma.event.update.mockResolvedValue({});

      const result: EnrichmentResult = await service.enrichEvent('ufc-326');

      expect(result.eventMatched).toBe(true);
      expect(result.ufcstatsEventId).toBe('abc123');
      expect(result.fightersEnriched).toBe(2);
      expect(result.fightersMissed).toBe(0);
      expect(result.fightsEnriched).toBe(1);
      expect(result.fightsMissed).toBe(0);

      // Event should be updated with ufcstatsId
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'ufc-326' },
        data: { ufcstatsId: 'abc123' },
      });

      // Fighters should be updated
      expect(mockPrisma.fighter.update).toHaveBeenCalledWith({
        where: { id: 'max-holloway' },
        data: { ufcstatsId: 'fid-holloway' },
      });
      expect(mockPrisma.fighter.update).toHaveBeenCalledWith({
        where: { id: 'charles-oliveira' },
        data: { ufcstatsId: 'fid-oliveira' },
      });

      // Fight should be updated
      expect(mockPrisma.fight.update).toHaveBeenCalledWith({
        where: { id: 'holloway-vs-oliveira' },
        data: { ufcstatsId: 'fight-001' },
      });
    });
  });

  // ─── T009: UFCStats fetch failure ─────────────────────────────────────────

  it('should not throw when UFCStats fetch fails', async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      id: 'ufc-326',
      name: 'UFC 326',
      fights: [],
    });

    // Both upcoming and completed list fetches fail
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

    await expect(service.enrichEvent('ufc-326')).resolves.not.toThrow();

    const result = await service.enrichEvent('ufc-326');
    expect(result.eventMatched).toBe(false);
  });

  // ─── T010: fighter name not found on UFCStats ──────────────────────────────

  it('should skip unmatched fighters and continue enriching others', async () => {
    const DETAIL_HTML_ONE_FIGHTER = `
      <html><body>
        <a href="/fighter-details/fid-holloway">Max Holloway</a>
        <tr data-link="http://ufcstats.com/fight-details/fight-001">
          <a href="/fighter-details/fid-holloway">Max Holloway</a>
        </tr>
      </body></html>
    `;

    mockPrisma.event.findUnique.mockResolvedValue({
      id: 'ufc-326',
      name: 'UFC 326',
      fights: [
        {
          id: 'holloway-vs-unknown',
          fighterAId: 'max-holloway',
          fighterBId: 'unknown-fighter',
          fighterA: { id: 'max-holloway', name: 'Max Holloway' },
          fighterB: { id: 'unknown-fighter', name: 'Unknown Fighter XYZ' },
        },
      ],
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_EVENTS_HTML),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(DETAIL_HTML_ONE_FIGHTER),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(DETAIL_HTML_ONE_FIGHTER),
      });

    mockPrisma.fighter.update.mockResolvedValue({});
    mockPrisma.fight.update.mockResolvedValue({});
    mockPrisma.event.update.mockResolvedValue({});

    const result = await service.enrichEvent('ufc-326');

    // Holloway matched, unknown-fighter missed
    expect(result.fightersEnriched).toBe(1);
    expect(result.fightersMissed).toBe(1);
    // Fight missed because unknown fighter has no ufcstatsId
    expect(result.fightsMissed).toBe(1);
    // Should not throw
  });

  // ─── Helper: normalize ────────────────────────────────────────────────────

  describe('normalize()', () => {
    it('should lowercase, strip diacritics and special characters', () => {
      expect(service.normalize('Max Holloway')).toBe('max holloway');
      expect(service.normalize('Jiří Procházka')).toBe('jiri prochazka');
      expect(service.normalize('Duško Todorović')).toBe('dusko todorovic');
      expect(service.normalize('Brando Peričić')).toBe('brando pericic');
      expect(service.normalize('Islam  Makhachev')).toBe('islam makhachev');
    });
  });
});
