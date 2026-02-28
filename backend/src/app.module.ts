import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { LeaguesModule } from './leagues/leagues.module';
import { EventsModule } from './events/events.module';
import { BetsModule } from './bets/bets.module';
import { FightersModule } from './fighters/fighters.module';
import { FightsModule } from './fights/fights.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health/health.controller';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    LeaguesModule,
    EventsModule,
    BetsModule,
    FightersModule,
    FightsModule,
    AdminModule,
    JobsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
