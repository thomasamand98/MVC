// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContratService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ContratService } from './contrat.service.js';
import type { CreateContratDto, UpdateContratDto } from './contrat.dto.js';

@Controller()
export class ContratController {
  constructor(private readonly contratService: ContratService) {}

  @Get('contrats')
  async getContrats() {
    const contrats = await this.contratService.getContrats();
    return { contrats };
  }

  @Post('contrats')
  async createContrat(@Body() dto: CreateContratDto) {
    return this.contratService.createContrat(dto);
  }

  @Patch('contrats/:id')
  async updateContrat(@Param('id') id: string, @Body() dto: UpdateContratDto) {
    return this.contratService.updateContrat(BigInt(id), dto);
  }

  @Delete('contrats/:id')
  async deleteContrat(@Param('id') id: string) {
    await this.contratService.deleteContrat(BigInt(id));
  }
}
