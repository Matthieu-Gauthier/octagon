import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';
import { Event, Fight, Fighter } from '@prisma/client';

@Injectable()
export class LiveScraperService {
  private readonly logger = new Logger(LiveScraperService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async handleLiveEvents() {
    this.logger.log('Starting live event scraper execution...');
    try {
      const now = new Date();

      // T005: Transition SCHEDULED events to LIVE if start time has passed.
      // Checks prelimsStartAt, mainCardStartAt OR the event date itself as fallback
      // (in case timestamps were not scraped, e.g. null).
      await this.prisma.event.updateMany({
        where: {
          status: 'SCHEDULED',
          OR: [
            { prelimsStartAt: { lte: now } },
            { mainCardStartAt: { lte: now } },
            // Fallback: event date has passed and timestamps are both null
            {
              AND: [
                { date: { lte: now } },
                { prelimsStartAt: null },
                { mainCardStartAt: null },
              ],
            },
          ],
        },
        data: { status: 'LIVE' },
      });

      // Fetch LIVE events with ufcstatsId on event and fights
      const liveEvents = await this.prisma.event.findMany({
        where: { status: 'LIVE' },
        include: {
          fights: {
            include: { fighterA: true, fighterB: true },
          },
        },
      });

      // Also fetch FINISHED events that still have fights with incomplete result data
      const incompleteFinishedEvents = await this.prisma.event.findMany({
        where: {
          status: 'FINISHED',
          fights: {
            some: {
              status: 'FINISHED',
              OR: [{ winnerId: null }, { method: null }, { round: null }],
            },
          },
        },
        include: {
          fights: {
            include: { fighterA: true, fighterB: true },
          },
        },
      });

      const eventsToScrape = [...liveEvents, ...incompleteFinishedEvents];

      if (eventsToScrape.length === 0) {
        return; // Nothing to scrape
      }

      for (const event of eventsToScrape) {
        await this.scrapeLiveEvent(event);
      }
    } catch (error) {
      this.logger.error(
        `Error during live event scraping: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Force re-scrape an event to patch missing fight results (winner, method, round).
   * Works regardless of event status (LIVE or FINISHED).
   */
  async rescrapeEvent(eventId: string): Promise<object> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { fights: { include: { fighterA: true, fighterB: true } } },
    });

    if (!event) {
      return { error: `Event '${eventId}' not found in DB` };
    }

    this.logger.log(`Manual rescrape triggered for event: ${eventId}`);
    await this.scrapeLiveEvent(event);
    return { success: true, eventId, message: 'Rescrape completed' };
  }

  /**
   * Public method for manual debug: returns diagnostics without modifying DB.
   */
  async debugScrape(eventSlug: string): Promise<object> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventSlug },
      include: { fights: { include: { fighterA: true, fighterB: true } } },
    });

    if (!event) {
      return { error: `Event '${eventSlug}' not found in DB` };
    }

    const url = `https://www.ufc.com/event/${event.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    // Slugs found on the UFC page
    const htmlFights: { fASlug: string; fBSlug: string; dataStatus: string }[] =
      [];
    $('.c-listing-fight').each((_, el) => {
      const links = $(el).find('.c-listing-fight__corner-name a');
      const corners = $(el).find('.c-listing-fight__corner-name');
      let fA = $(links[0]).attr('href')?.split('/').pop() || '';
      let fB = $(links[1]).attr('href')?.split('/').pop() || '';
      if (!fA && corners.length >= 1)
        fA = $(corners[0]).text().trim().toLowerCase().replace(/\s+/g, '-');
      if (!fB && corners.length >= 2)
        fB = $(corners[1]).text().trim().toLowerCase().replace(/\s+/g, '-');
      htmlFights.push({
        fASlug: fA,
        fBSlug: fB,
        dataStatus: $(el).attr('data-status') || '',
      });
    });

    // Match DB fights vs HTML
    const diagnosis = event.fights.map((fight) => {
      const match = htmlFights.find(
        (h) =>
          (h.fASlug === fight.fighterAId && h.fBSlug === fight.fighterBId) ||
          (h.fASlug === fight.fighterBId && h.fBSlug === fight.fighterAId),
      );
      return {
        fightId: fight.id,
        dbFighterA: fight.fighterAId,
        dbFighterB: fight.fighterBId,
        dbStatus: fight.status,
        htmlMatch: match ?? null,
        matched: !!match,
      };
    });

    return {
      eventId: event.id,
      eventStatus: event.status,
      eventDate: event.date,
      prelimsStartAt: event.prelimsStartAt,
      mainCardStartAt: event.mainCardStartAt,
      htmlFightsFound: htmlFights.length,
      htmlFights,
      dbFightsCount: event.fights.length,
      diagnosis,
    };
  }

  private async scrapeLiveEvent(
    event: Event & {
      fights: (Fight & { fighterA: Fighter; fighterB: Fighter })[];
    },
  ) {
    this.logger.log(`Scraping live event: ${event.id}`);

    // If ufcstatsId is not set, enrichment has not run yet — skip and warn
    if (!event.ufcstatsId) {
      this.logger.warn(
        `[LiveScraper] Event '${event.id}' has no ufcstatsId — skipping (run enrichment first)`,
      );
      return;
    }

    const url = `http://ufcstats.com/event-details/${event.ufcstatsId}`;

    try {
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      let allFightsFinished = true;

      for (const fight of event.fights) {
        let isFinished = fight.status === 'FINISHED';
        let newWinnerId: string | null = null;
        let newMethod: string | null = null;
        let newRound: number | null = null;

        if (!fight.ufcstatsId) {
          this.logger.warn(
            `[LiveScraper] Fight '${fight.id}' has no ufcstatsId — skipping`,
          );
          if (!isFinished) allFightsFinished = false;
          continue;
        }

        // Find the fight row by its ufcstatsId in data-link
        $(`tr[data-link*="${fight.ufcstatsId}"]`).each((_i, row) => {
          const cells = $(row).find('td');

          // Method: cell index 7
          const rawMethod = cells.eq(7).text().trim();
          if (rawMethod) {
            isFinished = true;
            newMethod = this.mapMethod(rawMethod);
          }

          // Round: cell index 8
          const rawRound = cells.eq(8).text().trim();
          if (rawRound) {
            const parsedRound = parseInt(rawRound, 10);
            if (!isNaN(parsedRound)) newRound = parsedRound;
          }

          // Winner: look for fighter links in the row; the winner's link ufcstatsId
          // appears in the first <a href="/fighter-details/{id}"> in the row
          // UFCStats show the WINNER first in completed fight rows
          const firstFighterHref =
            $(row).find('a[href*="/fighter-details/"]').first().attr('href') ??
            '';
          const winnerUfcstatsId = firstFighterHref
            .split('/fighter-details/')
            .pop();

          if (winnerUfcstatsId && isFinished) {
            if (fight.fighterA.ufcstatsId === winnerUfcstatsId) {
              newWinnerId = fight.fighterA.id;
            } else if (fight.fighterB.ufcstatsId === winnerUfcstatsId) {
              newWinnerId = fight.fighterB.id;
            }
          }

          return false; // break each
        });

        const alreadyFinishedButMissingData =
          fight.status === 'FINISHED' &&
          (fight.winnerId === null ||
            fight.method === null ||
            fight.round === null) &&
          (newWinnerId !== null || newMethod !== null || newRound !== null);

        if (isFinished && fight.status !== 'FINISHED') {
          await this.prisma.fight.update({
            where: { id: fight.id },
            data: {
              status: 'FINISHED',
              winnerId: newWinnerId,
              method: newMethod,
              round: newRound,
            },
          });
          this.logger.log(`Marked fight ${fight.id} as FINISHED.`);
        } else if (alreadyFinishedButMissingData) {
          await this.prisma.fight.update({
            where: { id: fight.id },
            data: {
              ...(newWinnerId !== null && { winnerId: newWinnerId }),
              ...(newMethod !== null && { method: newMethod }),
              ...(newRound !== null && { round: newRound }),
            },
          });
          this.logger.log(
            `Patched missing result data for finished fight ${fight.id}.`,
          );
        } else if (!isFinished) {
          allFightsFinished = false;
        }
      }

      // Transition event to FINISHED if all fights done
      if (allFightsFinished && event.fights.length > 0) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { status: 'FINISHED' },
        });
        this.logger.log(`Event ${event.id} is now FINISHED.`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to scrape live event ${event.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Map UFCStats method text to our standard DB values */
  private mapMethod(raw: string): string {
    const s = raw.toUpperCase().trim();
    if (s.includes('KO/TKO') || s.includes('KO') || s.includes('TKO'))
      return 'KO/TKO';
    if (s.includes('SUB')) return 'SUB';
    if (s.includes('DEC')) return 'DECISION';
    if (s === 'DRAW') return 'DRAW';
    if (s === 'CNC' || s.includes('NO CONTEST')) return 'NC';
    return 'UNKNOWN';
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=1.0',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        Cookie:
          'STYXKEY_region=CANADA_FRENCH.CA.en-can.Default; countryCode=CA',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
}
