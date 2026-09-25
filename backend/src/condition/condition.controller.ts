// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ConditionService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ConditionService } from './condition.service.js';
import { CreateConditionDto, UpdateConditionDto } from './condition.dto.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class ConditionController {
  constructor(private readonly conditionService: ConditionService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir ConditionService.getConditions pour le détail.
  @Get('conditions')
  async getConditions(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string) {
    return this.conditionService.getConditions(parsePage(page), parsePageSize(pageSize), search);
  }

  @Get('conditions/:id')
  async getCondition(@Param('id', ParseIdPipe) id: bigint) {
    return this.conditionService.getCondition(id);
  }

  @Post('conditions')
  async createCondition(@Body(new ZodBodyPipe(CreateConditionDto)) dto: CreateConditionDto) {
    return this.conditionService.createCondition(dto);
  }

  @Patch('conditions/:id')
  async updateCondition(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateConditionDto)) dto: UpdateConditionDto) {
    return this.conditionService.updateCondition(id, dto);
  }

  @Delete('conditions/:id')
  async deleteCondition(@Param('id', ParseIdPipe) id: bigint) {
    await this.conditionService.deleteCondition(id);
  }
}
