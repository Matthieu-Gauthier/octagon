import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperService, ScrapedEventData } from './scraper.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private scraper: ScraperService,
  ) {}

  async findAll(_userId: string) {
    return this.prisma.event.findMany({
      include: {
        fights: {
          include: {
            fighterA: true,
            fighterB: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        fights: {
          include: { fighterA: true, fighterB: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async fetchNextEvent() {
    this.logger.log('Executing fetchNextEvent request...');
    const scrapedData = await this.scraper.scrapeNextEvent();

    if (!scrapedData) {
      throw new NotFoundException(
        'Failed to scrape upcoming event from the source.',
      );
    }

    const { event } = scrapedData;
    const stats = await this.processScrapedData(scrapedData);

    return {
      success: true,
      message: `Successfully imported ${event.name}`,
      data: {
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
        },
        stats,
      },
    };
  }

  @Cron('0 4 * * *') // Run daily at 4:00 AM
  async handleUpcomingEventsCron() {
    this.logger.log('CRON: Fetching top 5 upcoming events...');
    try {
      const limit = 5;
      const scrapedArray = await this.scraper.scrapeUpcomingEvents(limit);
      for (const data of scrapedArray) {
        await this.processScrapedData(data);
      }
      this.logger.log(`CRON: Finished fetching top ${limit} upcoming events.`);
    } catch (err) {
      this.logger.error(
        `CRON Error fetching upcoming events: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  private async processScrapedData(scrapedData: ScrapedEventData) {
    const { event, fights, fighters } = scrapedData;

    // Upsert Event
    await this.prisma.event.upsert({
      where: { id: event.id },
      update: {
        name: event.name,
        date: event.date,
        location: event.location,
        status: event.status,
        prelimsStartAt: event.prelimsStartAt ?? null,
        mainCardStartAt: event.mainCardStartAt ?? null,
        eventImg: event.eventImg ?? null,
      },
      create: event,
    });

    // Upsert Fighters
    let fightersUpdated = 0;
    for (const fighter of fighters) {
      await this.prisma.fighter.upsert({
        where: { id: fighter.id },
        update: {
          wins: fighter.wins,
          losses: fighter.losses,
          draws: fighter.draws,
          noContests: fighter.noContests,
          winsByKo: fighter.winsByKo,
          winsBySub: fighter.winsBySub,
          winsByDec: fighter.winsByDec,
          height: fighter.height,
          weight: fighter.weight,
          reach: fighter.reach,
          stance: fighter.stance,
          sigStrikesLandedPerMin: fighter.sigStrikesLandedPerMin,
          takedownAvg: fighter.takedownAvg,
          hometown: fighter.hometown ?? null,
          ...(fighter.imagePath ? { imagePath: fighter.imagePath } : {}),
        },
        create: fighter,
      });
      fightersUpdated++;
    }

    // Upsert Fights
    let fightsAdded = 0;
    const validFightIds: string[] = [];

    for (const fight of fights) {
      validFightIds.push(fight.id);
      await this.prisma.fight.upsert({
        where: { id: fight.id },
        update: {
          division: fight.division,
          order: fight.order,
          rounds: fight.rounds,
          isMainEvent: fight.isMainEvent,
          isCoMainEvent: fight.isCoMainEvent,
          isMainCard: fight.isMainCard,
          isPrelim: fight.isPrelim,
          status: fight.status,
        },
        create: {
          ...fight,
          eventId: event.id,
        },
      });
      fightsAdded++;
    }

    // Delete fights that exist in DB for this event but are no longer in the scraped data (e.g. cancelled)
    if (validFightIds.length > 0) {
      const deleteResult = await this.prisma.fight.deleteMany({
        where: {
          eventId: event.id,
          id: { notIn: validFightIds },
        },
      });

      if (deleteResult.count > 0) {
        this.logger.log(
          `Deleted ${deleteResult.count} cancelled or removed fights from event ${event.id}`,
        );
      }
    }

    return { fightersAddedOrUpdated: fightersUpdated, fightsAdded };
  }

  async removeEvent(id: string) {
    // Find if event exists to provide a clean 404 if not
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found.`);
    }

    // Delete event (relations cascade)
    await this.prisma.event.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Event ${event.name} removed successfully.`,
    };
  }
}
