import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { BetsService } from './bets.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @UseGuards(SupabaseGuard)
  create(
    @Request() req: { user: { sub: string } },
    @Body()
    body: {
      leagueId: string;
      fightId: string;
      winnerId: string;
      method?: string;
      round?: number;
    },
  ) {
    return this.betsService.placeBet(
      req.user.sub,
      body.leagueId,
      body.fightId,
      {
        winnerId: body.winnerId,
        method: body.method,
        round: body.round,
      },
    );
  }

  @Get()
  @UseGuards(SupabaseGuard)
  findMyBets(
    @Request() req: { user: { sub: string } },
    @Query('leagueId') leagueId: string,
  ) {
    return this.betsService.findMyBets(req.user.sub, leagueId);
  }

  @Delete(':id')
  @UseGuards(SupabaseGuard)
  remove(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.betsService.remove(id, req.user.sub);
  }
}
