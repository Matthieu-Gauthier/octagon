import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { Prisma } from '@prisma/client';
import { SupabaseGuard } from '../auth/supabase.guard';
import { BetsService } from '../bets/bets.service';

@Controller('leagues')
export class LeaguesController {
  constructor(
    private readonly leaguesService: LeaguesService,
    private readonly betsService: BetsService,
  ) {}

  @Post()
  @UseGuards(SupabaseGuard)
  create(
    @Request() req: { user: { sub: string; email?: string } },
    @Body() createLeagueDto: Prisma.LeagueUncheckedCreateInput,
  ) {
    // Force adminId to be current user
    const user = req.user;
    const userId = user.sub;
    const email = user.email;

    // Pass user info to service to ensure user exists in DB
    return this.leaguesService.create({
      ...createLeagueDto,
      adminId: userId,
      adminEmail: email, // Pass email to create user if needed
      members: { create: { userId, role: 'ADMIN' } },
    });
  }

  @Get()
  @UseGuards(SupabaseGuard)
  findAll(@Request() req: { user: { sub: string } }) {
    return this.leaguesService.findAll(req.user.sub);
  }

  @Get(':id')
  @UseGuards(SupabaseGuard)
  findOne(@Param('id') id: string) {
    return this.leaguesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseGuard)
  update(
    @Param('id') id: string,
    @Body() updateLeagueDto: Prisma.LeagueUncheckedUpdateInput,
  ) {
    return this.leaguesService.update(id, updateLeagueDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseGuard)
  remove(@Param('id') id: string) {
    return this.leaguesService.remove(id);
  }

  @Post('join')
  @UseGuards(SupabaseGuard)
  join(
    @Request() req: { user: { sub: string; email?: string } },
    @Body() body: { code: string },
  ) {
    return this.leaguesService.join(body.code, req.user.sub, req.user.email);
  }

  @Get(':id/standings')
  @UseGuards(SupabaseGuard)
  getStandings(@Param('id') id: string) {
    return this.leaguesService.getStandings(id);
  }

  @Get(':id/bets')
  @UseGuards(SupabaseGuard)
  async getLeagueBets(@Param('id') id: string) {
    return this.betsService.findLeagueBets(id);
  }
}
