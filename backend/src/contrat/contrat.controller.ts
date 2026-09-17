// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContratService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContratService } from './contrat.service.js';
import type { CreateContratDto, UpdateContratDto } from './contrat.dto.js';

@Controller()
export class ContratController {
  constructor(private readonly contratService: ContratService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir ContratService.getContrats pour le détail.
  @Get('contrats')
  async getContrats(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.contratService.getContrats(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get('contrats/:id')
  async getContrat(@Param('id') id: string) {
    return this.contratService.getContrat(BigInt(id));
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
