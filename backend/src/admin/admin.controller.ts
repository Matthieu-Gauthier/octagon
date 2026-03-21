import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { LiveScraperService } from '../jobs/live-scraper.service';
import { EventsService } from '../events/events.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly liveScraperService: LiveScraperService,
    private readonly eventsService: EventsService,
  ) {}

  @Post('results')
  setResult(
    @Body()
    body: {
      fightId: string;
      result: {
        winnerId: string;
        method: string;
        round?: number;
        time?: string;
      };
    },
  ) {
    return this.adminService.setFightResult(body.fightId, body.result);
  }

  @Post('leagues/:id/archive')
  @UseGuards(SupabaseGuard)
  archiveLeague(@Param('id') id: string) {
    return this.adminService.archiveLeague(id);
  }

  /** Manually triggers the upcoming events fetch (normally runs at 4am). */
  @Post('trigger-fetch-events')
  triggerFetchEvents() {
    return this.eventsService.handleUpcomingEventsCron();
  }

  /** Manually triggers the live scraper cron logic immediately. */
  @Post('trigger-live-scraper')
  triggerLiveScraper() {
    return this.liveScraperService.handleLiveEvents();
  }

  /**
   * Debug endpoint: returns a JSON report showing what the UFC page
   * currently exposes vs what is stored in the DB — without touching anything.
   * Usage: POST /admin/scrape-debug/ufc-fight-night-february-28-2026
   */
  @Post('scrape-debug/:eventSlug')
  scrapeDebug(@Param('eventSlug') eventSlug: string) {
    return this.liveScraperService.debugScrape(eventSlug);
  }
}
