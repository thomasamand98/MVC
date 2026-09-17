import { Module } from '@nestjs/common';
import { ConditionController } from './condition.controller.js';
import { ConditionService } from './condition.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [ConditionController],
  providers: [ConditionService, PrismaService],
})
export class ConditionModule {}
