import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';
import { Event, Fight } from '@prisma/client';

@Injectable()
export class LiveScraperService {
  private readonly logger = new Logger(LiveScraperService.name);

  constructor(private prisma: PrismaService) { }

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

      // Fetch LIVE events and their fights
      const liveEvents = await this.prisma.event.findMany({
        where: { status: 'LIVE' },
        include: { fights: true },
      });

      // Also fetch FINISHED events that still have fights with incomplete result data
      const incompleteFinishedEvents = await this.prisma.event.findMany({
        where: {
          status: 'FINISHED',
          fights: {
            some: {
              status: 'FINISHED',
              OR: [
                { winnerId: null },
                { method: null },
                { round: null },
              ],
            },
          },
        },
        include: { fights: true },
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
      include: { fights: true },
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
      include: { fights: true },
    });

    if (!event) {
      return { error: `Event '${eventSlug}' not found in DB` };
    }

    const url = `https://www.ufc.com/event/${event.id}`;
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    // Slugs found on the UFC page
    const htmlFights: { fASlug: string; fBSlug: string; dataStatus: string }[] = [];
    $('.c-listing-fight').each((_, el) => {
      const links = $(el).find('.c-listing-fight__corner-name a');
      const corners = $(el).find('.c-listing-fight__corner-name');
      let fA = $(links[0]).attr('href')?.split('/').pop() || '';
      let fB = $(links[1]).attr('href')?.split('/').pop() || '';
      if (!fA && corners.length >= 1) fA = $(corners[0]).text().trim().toLowerCase().replace(/\s+/g, '-');
      if (!fB && corners.length >= 2) fB = $(corners[1]).text().trim().toLowerCase().replace(/\s+/g, '-');
      htmlFights.push({ fASlug: fA, fBSlug: fB, dataStatus: $(el).attr('data-status') || '' });
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

  private async scrapeLiveEvent(event: Event & { fights: Fight[] }) {
    this.logger.log(`Scraping live event: ${event.id}`);
    const url = `https://www.ufc.com/event/${event.id}`;

    try {
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      let allFightsFinished = true;

      for (const fight of event.fights) {
        // Find fight element on page by checking the fighter links inside .c-listing-fight
        let isFinished = fight.status === 'FINISHED';
        let newWinnerId: string | null = null;
        let newMethod: string | null = null;
        let newRound: number | null = null;

        this.logger.debug(
          `[LiveScraper] Looking for fight DB(${fight.fighterAId} vs ${fight.fighterBId})`,
        );

        $('.c-listing-fight').each((_, el) => {
          // Try to get slugs from <a href> links (scheduled fights)
          const fighterLinks = $(el).find('.c-listing-fight__corner-name a');

          // Fall back to plain-text corner names for finished fights
          // (UFC removes <a> tags once a fight is completed)
          const cornerNameEls = $(el).find('.c-listing-fight__corner-name');

          let fASlug = $(fighterLinks[0]).attr('href')?.split('/').pop() || '';
          let fBSlug = $(fighterLinks[1]).attr('href')?.split('/').pop() || '';

          if (!fASlug && cornerNameEls.length >= 1) {
            fASlug = $(cornerNameEls[0])
              .text()
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-');
          }
          if (!fBSlug && cornerNameEls.length >= 2) {
            fBSlug = $(cornerNameEls[1])
              .text()
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-');
          }

          if (!fASlug || !fBSlug) return;

          this.logger.debug(
            `[LiveScraper] HTML fight: ${fASlug} vs ${fBSlug} (data-status=${$(el).attr('data-status') ?? ''})`,
          );

          if (
            (fASlug === fight.fighterAId && fBSlug === fight.fighterBId) ||
            (fASlug === fight.fighterBId && fBSlug === fight.fighterAId)
          ) {
            // .c-listing-fight__outcome-wrapper is present in the DOM only
            // when the UFC has posted results for this fight.
            const hasOutcome =
              $(el).find('.c-listing-fight__outcome-wrapper').length > 0;
            if (hasOutcome) {
              isFinished = true;
            }

            // Check winner using .c-listing-fight__outcome--win
            const isRedWinner =
              $(el).find(
                '.c-listing-fight__corner-body--red .c-listing-fight__outcome--win',
              ).length > 0;
            const isBlueWinner =
              $(el).find(
                '.c-listing-fight__corner-body--blue .c-listing-fight__outcome--win',
              ).length > 0;
            // Check No Contest using .c-listing-fight__outcome--no-contest
            const isNoContest =
              $(el).find('.c-listing-fight__outcome--no-contest').length > 0;

            // Use fASlug/fBSlug (slugs actually extracted from the HTML red/blue corners)
            // instead of fight.fighterAId/fighterBId, because the UFC site order may be
            // red=fighterB, blue=fighterA (i.e. reversed from our DB).
            if (isRedWinner) {
              newWinnerId = fASlug; // whoever is in the red corner on the UFC page
              isFinished = true;
            } else if (isBlueWinner) {
              newWinnerId = fBSlug; // whoever is in the blue corner on the UFC page
              isFinished = true;
            } else if (isNoContest) {
              newMethod = 'NC';
              isFinished = true;
            }

            // Check method using .c-listing-fight__result-text.method
            const methodText = $(el)
              .find('.c-listing-fight__result-text.method')
              .text()
              .trim()
              .toLowerCase();

            if (methodText) {
              isFinished = true;
              // Map resultText to our standard methods: KO/TKO, SUBMISSION, DECISION, DRAW, NC
              if (methodText.includes('ko') || methodText.includes('tko')) {
                newMethod = 'KO/TKO';
              } else if (methodText.includes('sub')) {
                newMethod = 'SUB';
              } else if (methodText.includes('dec')) {
                newMethod = 'DECISION';
              } else if (methodText.includes('draw')) {
                newMethod = 'DRAW';
              } else if (
                methodText.includes('nc') ||
                methodText.includes('no contest')
              ) {
                newMethod = 'NC';
              } else {
                newMethod = 'UNKNOWN'; // Fallback
              }
            }

            // Check round using .c-listing-fight__result-text.round
            const roundText = $(el)
              .find('.c-listing-fight__result-text.round')
              .text()
              .trim();
            if (roundText) {
              const parsedRound = parseInt(roundText, 10);
              if (!isNaN(parsedRound)) {
                newRound = parsedRound;
              }
            }

            // Fallbacks for older markups or edge cases if method and round aren't parsed by class yet
            if (isFinished && !newMethod) {
              const backupText = $(el)
                .find('.c-listing-fight__result-text')
                .text()
                .trim()
                .toLowerCase();
              if (backupText.includes('ko') || backupText.includes('tko')) {
                newMethod = 'KO/TKO';
              } else if (backupText.includes('sub')) {
                newMethod = 'SUB';
              } else if (backupText.includes('dec')) {
                newMethod = 'DECISION';
              } else if (backupText.includes('draw')) {
                newMethod = 'DRAW';
              } else if (
                backupText.includes('nc') ||
                backupText.includes('no contest')
              ) {
                newMethod = 'NC';
              }
            }

            if (isFinished && !newRound) {
              const roundMatch =
                $(el)
                  .text()
                  .match(/round[\s:]*(\d+)/i) ||
                $(el)
                  .text()
                  .match(/r(\d+)/i);
              if (roundMatch) {
                newRound = parseInt(roundMatch[1], 10);
              }
            }

            return false; // break the each loop
          }
        });

        const alreadyFinishedButMissingData =
          fight.status === 'FINISHED' &&
          (fight.winnerId === null || fight.method === null || fight.round === null) &&
          (newWinnerId !== null || newMethod !== null || newRound !== null);

        if (isFinished && fight.status !== 'FINISHED') {
          // T007: Fight just finished — write full result
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
          // Fight was already FINISHED but result data was missing — patch it now
          await this.prisma.fight.update({
            where: { id: fight.id },
            data: {
              ...(newWinnerId !== null && { winnerId: newWinnerId }),
              ...(newMethod !== null && { method: newMethod }),
              ...(newRound !== null && { round: newRound }),
            },
          });
          this.logger.log(`Patched missing result data for finished fight ${fight.id}.`);
        } else if (!isFinished) {
          allFightsFinished = false;
        }
      }

      // T008: Transition event to FINISHED if ALL fights are finished
      if (allFightsFinished && event.fights.length > 0) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { status: 'FINISHED' },
        });
        this.logger.log(`Event ${event.id} is now FINISHED.`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to scrape live event ${event.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
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
