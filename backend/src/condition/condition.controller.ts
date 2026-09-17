// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ConditionService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConditionService } from './condition.service.js';
import type { CreateConditionDto, UpdateConditionDto } from './condition.dto.js';

@Controller()
export class ConditionController {
  constructor(private readonly conditionService: ConditionService) {}

  @Get('conditions')
  async getConditions() {
    const conditions = await this.conditionService.getConditions();
    return { conditions };
  }

  @Post('conditions')
  async createCondition(@Body() dto: CreateConditionDto) {
    return this.conditionService.createCondition(dto);
  }

  @Patch('conditions/:id')
  async updateCondition(@Param('id') id: string, @Body() dto: UpdateConditionDto) {
    return this.conditionService.updateCondition(BigInt(id), dto);
  }

  @Delete('conditions/:id')
  async deleteCondition(@Param('id') id: string) {
    await this.conditionService.deleteCondition(BigInt(id));
  }
}
