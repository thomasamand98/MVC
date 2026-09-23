import { Module } from '@nestjs/common';
import { ConditionCmrController } from './condition-cmr.controller.js';
import { ConditionCmrService } from './condition-cmr.service.js';

@Module({
  controllers: [ConditionCmrController],
  providers: [ConditionCmrService],
})
export class ConditionCmrModule {}
