import { Module } from '@nestjs/common';
import { PointController } from './point.controller.js';
import { PointService } from './point.service.js';

@Module({
  controllers: [PointController],
  providers: [PointService],
})
export class PointModule {}
