import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';
import { Event, Fight } from '@prisma/client';

@Injectable()
export class LiveScraperService {
  private readonly logger = new Logger(LiveScraperService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async handleLiveEvents() {
    this.logger.log('Starting live event scraper execution...');
    try {
      const now = new Date();

      // T005: Transition SCHEDULED events to LIVE if start time has passed
      await this.prisma.event.updateMany({
        where: {
          status: 'SCHEDULED',
          OR: [
            { prelimsStartAt: { lte: now } },
            { mainCardStartAt: { lte: now } },
          ],
        },
        data: { status: 'LIVE' },
      });

      // Fetch LIVE events and their fights
      const liveEvents = await this.prisma.event.findMany({
        where: { status: 'LIVE' },
        include: { fights: true },
      });

      if (liveEvents.length === 0) {
        return; // Nothing to scrape
      }

      for (const event of liveEvents) {
        await this.scrapeLiveEvent(event);
      }
    } catch (error) {
      this.logger.error(
        `Error during live event scraping: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
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

        $('.c-listing-fight').each((_, el) => {
          const fighterLinks = $(el).find('.c-listing-fight__corner-name a');
          if (fighterLinks.length < 2) return;

          const fASlug =
            $(fighterLinks[0]).attr('href')?.split('/').pop() || '';
          const fBSlug =
            $(fighterLinks[1]).attr('href')?.split('/').pop() || '';

          if (
            (fASlug === fight.fighterAId && fBSlug === fight.fighterBId) ||
            (fASlug === fight.fighterBId && fBSlug === fight.fighterAId)
          ) {
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

            if (isRedWinner) {
              newWinnerId = fight.fighterAId;
              isFinished = true;
            } else if (isBlueWinner) {
              newWinnerId = fight.fighterBId;
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

        if (isFinished && fight.status !== 'FINISHED') {
          // T007: Update Fight record
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
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=1.0',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
}
