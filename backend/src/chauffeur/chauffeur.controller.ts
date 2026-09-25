// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ChauffeurService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ChauffeurService } from './chauffeur.service.js';
import { CreateChauffeurDto, UpdateChauffeurDto } from './chauffeur.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parseArchive, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class ChauffeurController {
  constructor(private readonly chauffeurService: ChauffeurService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). ?archive=0|1 : non archivés / archivés, absent = tous. Voir
  // ChauffeurService.getChauffeurs pour le détail.
  @Get('chauffeurs')
  async getChauffeurs(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string, @Query('archive') archive?: string) {
    return this.chauffeurService.getChauffeurs(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids), parseArchive(archive));
  }

  @Get('chauffeurs/:id')
  async getChauffeur(@Param('id', ParseIdPipe) id: bigint) {
    return this.chauffeurService.getChauffeur(id);
  }

  @Post('chauffeurs')
  async createChauffeur(@Body(new ZodBodyPipe(CreateChauffeurDto)) dto: CreateChauffeurDto) {
    return this.chauffeurService.createChauffeur(dto);
  }

  @Patch('chauffeurs/:id')
  async updateChauffeur(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateChauffeurDto)) dto: UpdateChauffeurDto) {
    return this.chauffeurService.updateChauffeur(id, dto);
  }

  @Delete('chauffeurs/:id')
  async deleteChauffeur(@Param('id', ParseIdPipe) id: bigint) {
    await this.chauffeurService.deleteChauffeur(id);
  }
}
