import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';

export interface EnrichmentResult {
  eventId: string;
  eventMatched: boolean;
  ufcstatsEventId: string | null;
  fightersEnriched: number;
  fightersMissed: number;
  fightsEnriched: number;
  fightsMissed: number;
}

@Injectable()
export class UfcstatsEnrichmentService {
  private readonly logger = new Logger(UfcstatsEnrichmentService.name);
  private readonly UFCSTATS_BASE = 'http://ufcstats.com';

  constructor(private readonly prisma: PrismaService) {}

  // ─── Public API ────────────────────────────────────────────────────────────

  async enrichEvent(eventId: string): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      eventId,
      eventMatched: false,
      ufcstatsEventId: null,
      fightersEnriched: 0,
      fightersMissed: 0,
      fightsEnriched: 0,
      fightsMissed: 0,
    };

    // 1. Load event from DB with full fight + fighter relations
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        fights: {
          include: {
            fighterA: true,
            fighterB: true,
          },
        },
      },
    });

    if (!event) {
      this.logger.warn(`[Enrichment] Event '${eventId}' not found in DB`);
      return result;
    }

    // 2. Match event on UFCStats
    const ufcstatsEvent = await this.findUfcstatsEvent(event.name);
    if (!ufcstatsEvent) {
      this.logger.warn(
        `[Enrichment] No UFCStats match for event '${event.name}'`,
      );
      return result;
    }

    result.eventMatched = true;
    result.ufcstatsEventId = ufcstatsEvent.ufcstatsId;

    // 3. Build fighter map: normalizedName → ufcstatsId
    const fighterMap = await this.buildFighterMap(ufcstatsEvent.ufcstatsId);

    // 4. Build fight row list: [{ ufcstatsId, rowHtml }]
    const fightRows = await this.buildFightRows(ufcstatsEvent.ufcstatsId);

    // 5. Collect all unique fighters on this event card
    const fightersSeen = new Set<string>();
    for (const fight of event.fights) {
      fightersSeen.add(fight.fighterAId);
      fightersSeen.add(fight.fighterBId);
    }

    // Fighter UFCStats ID tracking: dbFighterId → ufcstatsId
    const resolvedFighters = new Map<string, string>();

    // 6. Enrich fighters
    for (const fight of event.fights) {
      for (const fighter of [fight.fighterA, fight.fighterB]) {
        if (resolvedFighters.has(fighter.id)) continue; // already processed

        const normalized = this.normalize(fighter.name);
        const ufcstatsId = fighterMap.get(normalized);

        if (!ufcstatsId) {
          // Try word-overlap fallback
          const parts = normalized.split(' ');
          let fallback: string | undefined;
          for (const [key, val] of fighterMap) {
            const keyParts = key.split(' ');
            // Match if all parts of UFCStats name are in DB name, OR all parts of DB name are in UFCStats name
            if (
              keyParts.every((kp) => parts.includes(kp)) ||
              parts.every((p) => keyParts.includes(p))
            ) {
              fallback = val;
              break;
            }
          }
          if (!fallback) {
            this.logger.warn(
              `[Enrichment] No UFCStats match for fighter '${fighter.name}'`,
            );
            result.fightersMissed++;
            continue;
          }
          resolvedFighters.set(fighter.id, fallback);
        } else {
          resolvedFighters.set(fighter.id, ufcstatsId);
        }

        try {
          await this.prisma.fighter.update({
            where: { id: fighter.id },
            data: { ufcstatsId: resolvedFighters.get(fighter.id) },
          });
          result.fightersEnriched++;
        } catch (err) {
          this.logger.warn(
            `[Enrichment] Failed to update fighter '${fighter.id}': ${String(err)}`,
          );
          result.fightersMissed++;
        }
      }
    }

    // 7. Enrich fights
    for (const fight of event.fights) {
      const idA = resolvedFighters.get(fight.fighterAId);
      const idB = resolvedFighters.get(fight.fighterBId);

      if (!idA || !idB) {
        this.logger.warn(
          `[Enrichment] Cannot match fight ${fight.id} — missing fighter UFCStats IDs`,
        );
        result.fightsMissed++;
        continue;
      }

      const matchedRow = fightRows.find(
        (r) => r.fighterIds.includes(idA) && r.fighterIds.includes(idB),
      );

      if (!matchedRow) {
        this.logger.warn(
          `[Enrichment] No UFCStats row found for fight ${fight.id}`,
        );
        result.fightsMissed++;
        continue;
      }

      try {
        await this.prisma.fight.update({
          where: { id: fight.id },
          data: { ufcstatsId: matchedRow.ufcstatsId },
        });
        result.fightsEnriched++;
      } catch (err) {
        this.logger.warn(
          `[Enrichment] Failed to update fight '${fight.id}': ${String(err)}`,
        );
        result.fightsMissed++;
      }
    }

    // 8. Enrich event
    await this.prisma.event.update({
      where: { id: eventId },
      data: { ufcstatsId: ufcstatsEvent.ufcstatsId },
    });

    this.logger.log(
      `[Enrichment] Event '${eventId}' enriched: ` +
        `fighters ${result.fightersEnriched}/${result.fightersEnriched + result.fightersMissed}, ` +
        `fights ${result.fightsEnriched}/${result.fightsEnriched + result.fightsMissed}`,
    );

    return result;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /** Lowercase, remove diacritics, remove non-alphanumeric, collapse spaces */
  normalize(name: string): string {
    return name
      .normalize('NFD') // decompose diacritics
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Search UFCStats event lists (upcoming then completed) for an event
   * whose name contains all significant words from the provided event name.
   */
  async findUfcstatsEvent(
    eventName: string,
  ): Promise<{ ufcstatsId: string; name: string } | null> {
    const words = this.normalize(eventName)
      .split(' ')
      .filter((w) => w.length > 2);

    for (const src of ['upcoming', 'completed'] as const) {
      try {
        const html = await this.fetchHtml(
          `${this.UFCSTATS_BASE}/statistics/events/${src}?page=all`,
        );
        const $ = cheerio.load(html);
        let found: { ufcstatsId: string; name: string } | null = null;

        $('a[href*="/event-details/"]').each((_i, el) => {
          const href = $(el).attr('href') ?? '';
          const text = $(el).text().trim();
          if (words.every((w) => this.normalize(text).includes(w))) {
            found = {
              ufcstatsId: href.split('/event-details/')[1],
              name: text,
            };
            return false; // break
          }
        });

        if (found) return found;
      } catch (err) {
        this.logger.warn(
          `[Enrichment] Failed to fetch ${src} events list: ${String(err)}`,
        );
      }
    }

    return null;
  }

  /**
   * Fetch a UFCStats event detail page and return a map of
   * normalizedFighterName → ufcstatsId
   */
  async buildFighterMap(ufcstatsEventId: string): Promise<Map<string, string>> {
    const html = await this.fetchHtml(
      `${this.UFCSTATS_BASE}/event-details/${ufcstatsEventId}`,
    );
    const $ = cheerio.load(html);
    const map = new Map<string, string>();

    $('a[href*="/fighter-details/"]').each((_i, el) => {
      const href = $(el).attr('href') ?? '';
      const name = $(el).text().trim();
      const id = href.split('/fighter-details/')[1];
      if (id && name) {
        map.set(this.normalize(name), id);
      }
    });

    return map;
  }

  /**
   * Fetch a UFCStats event detail page and return all fight rows:
   * [{ ufcstatsId, fighterIds }]
   */
  async buildFightRows(
    ufcstatsEventId: string,
  ): Promise<{ ufcstatsId: string; fighterIds: string[] }[]> {
    const html = await this.fetchHtml(
      `${this.UFCSTATS_BASE}/event-details/${ufcstatsEventId}`,
    );
    const $ = cheerio.load(html);
    const rows: { ufcstatsId: string; fighterIds: string[] }[] = [];

    $('tr[data-link*="/fight-details/"]').each((_i, el) => {
      const link = $(el).attr('data-link') ?? '';
      const ufcstatsId = link.split('/fight-details/')[1];
      if (ufcstatsId) {
        const fighterIds: string[] = [];
        $(el)
          .find('a[href*="/fighter-details/"]')
          .each((_j, a) => {
            const href = $(a).attr('href') ?? '';
            const fid = href.split('/fighter-details/')[1];
            if (fid) fighterIds.push(fid);
          });
        rows.push({ ufcstatsId, fighterIds });
      }
    });

    return rows;
  }

  async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Octagon/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
    return res.text();
  }
}
