import { Module } from '@nestjs/common';
import { FilmService } from './film.service';
import { FilmController } from './film.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FilmController],
  providers: [FilmService, PrismaService],
})
export class FilmModule {}
