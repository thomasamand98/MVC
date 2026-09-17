import { Module } from '@nestjs/common';
import { AttelageController } from './attelage.controller.js';
import { AttelageService } from './attelage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [AttelageController],
  providers: [AttelageService, PrismaService],
})
export class AttelageModule {}
