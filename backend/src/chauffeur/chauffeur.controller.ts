// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ChauffeurService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ChauffeurService } from './chauffeur.service.js';
import type { CreateChauffeurDto, UpdateChauffeurDto } from './chauffeur.dto.js';
import { parseProjection } from '../common/projection.js';

@Controller()
export class ChauffeurController {
  constructor(private readonly chauffeurService: ChauffeurService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir ChauffeurService.getChauffeurs pour le détail.
  @Get('chauffeurs')
  async getChauffeurs(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.chauffeurService.getChauffeurs(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, search, parseProjection(via, ids));
  }

  @Get('chauffeurs/:id')
  async getChauffeur(@Param('id') id: string) {
    return this.chauffeurService.getChauffeur(BigInt(id));
  }

  @Post('chauffeurs')
  async createChauffeur(@Body() dto: CreateChauffeurDto) {
    return this.chauffeurService.createChauffeur(dto);
  }

  @Patch('chauffeurs/:id')
  async updateChauffeur(@Param('id') id: string, @Body() dto: UpdateChauffeurDto) {
    return this.chauffeurService.updateChauffeur(BigInt(id), dto);
  }

  @Delete('chauffeurs/:id')
  async deleteChauffeur(@Param('id') id: string) {
    await this.chauffeurService.deleteChauffeur(BigInt(id));
  }
}
