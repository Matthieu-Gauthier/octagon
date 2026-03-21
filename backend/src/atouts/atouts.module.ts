import { Module } from '@nestjs/common';
import { AtoutsController } from './atouts.controller';
import { AtoutsService } from './atouts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AtoutsController],
  providers: [AtoutsService],
})
export class AtoutsModule {}
