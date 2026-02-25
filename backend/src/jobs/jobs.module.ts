import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LiveScraperService } from './live-scraper.service';
import { EventsModule } from '../events/events.module';
import { FightsModule } from '../fights/fights.module';

@Module({
    imports: [PrismaModule],
    providers: [LiveScraperService],
})
export class JobsModule { }
