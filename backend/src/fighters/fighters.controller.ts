import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FightersService } from './fighters.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('fighters')
export class FightersController {
    constructor(private readonly fightersService: FightersService) { }

    @Get()
    @UseGuards(SupabaseGuard)
    findAll() {
        return this.fightersService.findAll();
    }

    @Get(':id')
    @UseGuards(SupabaseGuard)
    findOne(@Param('id') id: string) {
        return this.fightersService.findOne(id);
    }
}
