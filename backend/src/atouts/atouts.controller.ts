import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AtoutsService } from './atouts.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('atouts')
@UseGuards(SupabaseGuard)
export class AtoutsController {
  constructor(private readonly atoutsService: AtoutsService) {}

  @Post()
  play(
    @Request() req: { user: { sub: string } },
    @Body() body: {
      leagueId: string;
      eventId: string;
      fightId: string;
      type: string;
      playedByName: string;
      targetUserId?: string;
      targetUserName?: string;
    },
  ) {
    return this.atoutsService.play(req.user.sub, body);
  }

  @Get()
  findAll(
    @Query('leagueId') leagueId: string,
    @Query('eventId') eventId: string,
  ) {
    return this.atoutsService.findByLeagueAndEvent(leagueId, eventId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.atoutsService.remove(id, req.user.sub);
  }
}
