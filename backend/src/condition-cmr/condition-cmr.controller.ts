// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ConditionCmrService).
// Pas de GET : les conditions d'un contrat sont renvoyées avec la fiche
// contrat (GET /contrats/:id, voir ContratService).
import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ConditionCmrService } from './condition-cmr.service.js';
import { CreateConditionCmrDto, UpdateConditionCmrDto } from './condition-cmr.dto.js';
import { ParseIdPipe } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class ConditionCmrController {
  constructor(private readonly conditionCmrService: ConditionCmrService) {}

  @Post('conditions-cmr')
  async createConditionCmr(@Body(new ZodBodyPipe(CreateConditionCmrDto)) dto: CreateConditionCmrDto) {
    return this.conditionCmrService.createConditionCmr(dto);
  }

  @Patch('conditions-cmr/:id')
  async updateConditionCmr(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateConditionCmrDto)) dto: UpdateConditionCmrDto) {
    return this.conditionCmrService.updateConditionCmr(id, dto);
  }

  @Delete('conditions-cmr/:id')
  async deleteConditionCmr(@Param('id', ParseIdPipe) id: bigint) {
    await this.conditionCmrService.deleteConditionCmr(id);
  }
}
