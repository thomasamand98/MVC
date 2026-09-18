import { Module } from '@nestjs/common';
import { PointageController } from './pointage.controller.js';
import { PointageService } from './pointage.service.js';

@Module({
  controllers: [PointageController],
  providers: [PointageService],
})
export class PointageModule {}
