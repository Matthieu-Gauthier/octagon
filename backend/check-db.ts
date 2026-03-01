import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const liveEvents = await prisma.event.findMany({
        where: { status: 'LIVE' },
        include: { fights: true }
    });
    console.log(JSON.stringify(liveEvents, null, 2));

    const scheduled = await prisma.event.findMany({
        where: { status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        take: 1
    });
    console.log('Next scheduled event:', scheduled);
    await app.close();
}

bootstrap()
    .catch((e) => console.error(e));
