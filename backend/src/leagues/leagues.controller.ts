import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { Prisma } from '@prisma/client';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('leagues')
export class LeaguesController {
    constructor(private readonly leaguesService: LeaguesService) { }

    @Post()
    @UseGuards(SupabaseGuard)
    create(@Request() req: any, @Body() createLeagueDto: Prisma.LeagueUncheckedCreateInput) {
        // Force adminId to be current user
        const userId = req.user.sub;
        createLeagueDto.adminId = userId;

        // Also add as member automatically? Service doesn't do it, so we should.
        // Actually, prisma create with nested write is better, but UncheckedInput is simpler.
        // Let's rely on client to send correct structure OR update service. 
        // For MVP, user creates league, then joins? No, admin should be a member.
        // The service create method just does `prisma.league.create({ data })`.
        // It's better to update the service to handle the transaction or nested write for admin member.
        // But for now, let's assume the body contains the members connect logic or we do it here.
        // Simple fix: Add admin as member in the DTO if possible, or 2 steps.
        // Update: Service create uses simple create.
        // Let's make `create` in service robust? I'll stick to simple for now. 
        // Ideally:
        /*
        return this.leaguesService.create({
            ...createLeagueDto,
            adminId: userId,
            members: { create: { userId, role: 'ADMIN' } }
        });
        */
        // I will try to pass this structure.
        return this.leaguesService.create({
            ...createLeagueDto,
            adminId: userId,
            members: { create: { userId, role: 'ADMIN' } }
        });
    }

    @Get()
    @UseGuards(SupabaseGuard)
    findAll() {
        return this.leaguesService.findAll();
    }

    @Get(':id')
    @UseGuards(SupabaseGuard)
    findOne(@Param('id') id: string) {
        return this.leaguesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(SupabaseGuard)
    update(@Param('id') id: string, @Body() updateLeagueDto: Prisma.LeagueUncheckedUpdateInput) {
        return this.leaguesService.update(id, updateLeagueDto);
    }

    @Delete(':id')
    @UseGuards(SupabaseGuard)
    remove(@Param('id') id: string) {
        return this.leaguesService.remove(id);
    }

    @Post('join')
    @UseGuards(SupabaseGuard)
    join(@Request() req: any, @Body() body: { code: string }) {
        return this.leaguesService.join(body.code, req.user.sub);
    }

    @Get(':id/standings')
    @UseGuards(SupabaseGuard)
    getStandings(@Param('id') id: string) {
        return this.leaguesService.getStandings(id);
    }
}
