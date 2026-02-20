import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BetsModule } from '../bets/bets.module';

@Module({
  imports: [PrismaModule, BetsModule],
  controllers: [LeaguesController],
  providers: [LeaguesService]
})
export class LeaguesModule { }
