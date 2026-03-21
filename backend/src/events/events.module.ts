import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ScraperService } from './scraper.service';
import { UfcstatsEnrichmentService } from './ufcstats-enrichment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [EventsController],
  providers: [EventsService, ScraperService, UfcstatsEnrichmentService],
  exports: [EventsService, UfcstatsEnrichmentService],
})
export class EventsModule {}
