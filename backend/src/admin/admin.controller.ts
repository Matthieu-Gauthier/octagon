import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseGuard } from '../auth/supabase.guard';

// Ideally restrict to Admin Users only. 
// For MVP, anyone with valid token might be allowed OR we check role in DB.
// Let's stick to SupabaseGuard for now (Authenticated). 
// Real app would need @Roles('ADMIN') guard.

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('results')
    @UseGuards(SupabaseGuard)
    setResult(@Body() body: { fightId: string; result: any }) {
        return this.adminService.setFightResult(body.fightId, body.result);
    }

    @Post('leagues/:id/archive')
    @UseGuards(SupabaseGuard)
    archiveLeague(@Param('id') id: string) {
        return this.adminService.archiveLeague(id);
    }
}
