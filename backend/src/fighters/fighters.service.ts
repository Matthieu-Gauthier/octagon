import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FightersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fighter.findMany();
  }

  async findOne(id: string) {
    const fighter = await this.prisma.fighter.findUnique({ where: { id } });
    if (!fighter) throw new NotFoundException('Fighter not found');
    return fighter;
  }
}
