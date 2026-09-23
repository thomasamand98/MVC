// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ConditionCmrService).
// Pas de GET : les conditions d'un contrat sont renvoyées avec la fiche
// contrat (GET /contrats/:id, voir ContratService).
import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ConditionCmrService } from './condition-cmr.service.js';
import type { CreateConditionCmrDto, UpdateConditionCmrDto } from './condition-cmr.dto.js';

@Controller()
export class ConditionCmrController {
  constructor(private readonly conditionCmrService: ConditionCmrService) {}

  @Post('conditions-cmr')
  async createConditionCmr(@Body() dto: CreateConditionCmrDto) {
    return this.conditionCmrService.createConditionCmr(dto);
  }

  @Patch('conditions-cmr/:id')
  async updateConditionCmr(@Param('id') id: string, @Body() dto: UpdateConditionCmrDto) {
    return this.conditionCmrService.updateConditionCmr(BigInt(id), dto);
  }

  @Delete('conditions-cmr/:id')
  async deleteConditionCmr(@Param('id') id: string) {
    await this.conditionCmrService.deleteConditionCmr(BigInt(id));
  }
}
