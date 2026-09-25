// ===== CONTROLLER =====
// Contrats de travail d'un personnel et leurs taux horaires (onglet Contrat
// de la fiche personnel). Délègue au Model (ContratTravailService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ContratTravailService } from './contrat-travail.service.js';
import { ContratTravailDto } from './contrat-travail.dto.js';
import { ParseIdPipe } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class ContratTravailController {
  constructor(private readonly contratTravailService: ContratTravailService) {}

  @Get('personnel/:id/contrats-travail')
  async getContrats(@Param('id', ParseIdPipe) id: bigint) {
    return this.contratTravailService.getContrats(id);
  }

  @Post('personnel/:id/contrats-travail')
  async createContrat(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(ContratTravailDto)) dto: ContratTravailDto) {
    return this.contratTravailService.createContrat(id, dto);
  }

  @Patch('contrats-travail/:id')
  async updateContrat(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(ContratTravailDto)) dto: ContratTravailDto) {
    return this.contratTravailService.updateContrat(id, dto);
  }

  @Delete('contrats-travail/:id')
  async deleteContrat(@Param('id', ParseIdPipe) id: bigint) {
    await this.contratTravailService.deleteContrat(id);
  }
}
