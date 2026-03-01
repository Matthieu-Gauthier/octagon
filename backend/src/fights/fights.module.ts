import { Module } from '@nestjs/common';
import { FightsService } from './fights.service';
import { FightsController } from './fights.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FightsController],
  providers: [FightsService],
})
export class FightsModule {}
