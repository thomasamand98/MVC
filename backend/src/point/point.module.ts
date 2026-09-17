import { Module } from '@nestjs/common';
import { PointController } from './point.controller.js';
import { PointService } from './point.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [PointController],
  providers: [PointService, PrismaService],
})
export class PointModule {}
