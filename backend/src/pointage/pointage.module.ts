import { Module } from '@nestjs/common';
import { PointageController } from './pointage.controller.js';
import { PointageService } from './pointage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [PointageController],
  providers: [PointageService, PrismaService],
})
export class PointageModule {}
