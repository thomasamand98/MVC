// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ConditionService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ConditionService } from './condition.service.js';
import type { CreateConditionDto, UpdateConditionDto } from './condition.dto.js';

@Controller()
export class ConditionController {
  constructor(private readonly conditionService: ConditionService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir ConditionService.getConditions pour le détail.
  @Get('conditions')
  async getConditions(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.conditionService.getConditions(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get('conditions/:id')
  async getCondition(@Param('id') id: string) {
    return this.conditionService.getCondition(BigInt(id));
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
