import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    @UseGuards(SupabaseGuard)
    findAll(@Request() req: any) {
        return this.eventsService.findAll(req.user.sub);
    }

    @Get(':id')
    @UseGuards(SupabaseGuard)
    findOne(@Param('id') id: string) {
        return this.eventsService.findOne(id);
    }
}
