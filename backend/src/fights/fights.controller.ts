import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FightsService } from './fights.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@Controller('fights')
export class FightsController {
    constructor(private readonly fightsService: FightsService) { }

    @Patch(':id/result')
    @UseGuards(SupabaseGuard)
    updateResult(
        @Param('id') id: string,
        @Body() updateFightDto: { winnerId?: string | null; method?: string | null; round?: number | null }
    ) {
        return this.fightsService.updateResult(id, updateFightDto);
    }
}
