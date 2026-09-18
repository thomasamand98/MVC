import { Module } from '@nestjs/common';
import { AttelageController } from './attelage.controller.js';
import { AttelageService } from './attelage.service.js';

@Module({
  controllers: [AttelageController],
  providers: [AttelageService],
})
export class AttelageModule {}
