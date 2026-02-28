import { Module } from '@nestjs/common';
import { FightersController } from './fighters.controller';
import { FightersService } from './fighters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FightersController],
  providers: [FightersService],
})
export class FightersModule {}
