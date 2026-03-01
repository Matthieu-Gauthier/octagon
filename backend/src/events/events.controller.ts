import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { LiveScraperService } from '../jobs/live-scraper.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly liveScraperService: LiveScraperService,
  ) {}

  @Get()
  @UseGuards(SupabaseGuard)
  findAll(@Request() req: { user: { sub: string } }) {
    return this.eventsService.findAll(req.user.sub);
  }

  @Get(':id')
  @UseGuards(SupabaseGuard)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post('admin/fetch')
  @UseGuards(SupabaseGuard)
  fetchNextEvent() {
    return this.eventsService.fetchNextEvent();
  }

  @Post('admin/:id/rescrape')
  @UseGuards(SupabaseGuard)
  rescrapeEvent(@Param('id') id: string) {
    return this.liveScraperService.rescrapeEvent(id);
  }

  @Delete('admin/:id')
  @UseGuards(SupabaseGuard)
  removeEvent(@Param('id') id: string) {
    return this.eventsService.removeEvent(id);
  }
}
