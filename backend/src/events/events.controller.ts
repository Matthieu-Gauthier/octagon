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
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
  @UseGuards(SupabaseGuard) // Todo: Wrap in specific AdminGuard later (T022)
  fetchNextEvent() {
    return this.eventsService.fetchNextEvent();
  }

  @Delete('admin/:id')
  @UseGuards(SupabaseGuard) // Todo: Wrap in specific AdminGuard later
  removeEvent(@Param('id') id: string) {
    return this.eventsService.removeEvent(id);
  }
}
