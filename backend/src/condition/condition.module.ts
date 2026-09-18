import { Module } from '@nestjs/common';
import { ConditionController } from './condition.controller.js';
import { ConditionService } from './condition.service.js';

@Module({
  controllers: [ConditionController],
  providers: [ConditionService],
})
export class ConditionModule {}
