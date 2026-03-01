import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [PrismaModule, JobsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
