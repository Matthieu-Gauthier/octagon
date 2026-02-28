import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LiveScraperService } from './live-scraper.service';

@Module({
  imports: [PrismaModule],
  providers: [LiveScraperService],
})
export class JobsModule {}
