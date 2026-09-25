// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PointageService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PointageService } from './pointage.service.js';
import { CreatePointageDto, UpdatePointageDto } from './pointage.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class PointageController {
  constructor(private readonly pointageService: PointageService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir PointageService.getPointages pour le détail.
  @Get('pointage')
  async getPointages(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.pointageService.getPointages(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  // Liste des statuts de pointage (table types_statut) pour le sélecteur
  // du formulaire. Déclarée avant pointage/:id, comme la feuille.
  @Get('pointage/statuts')
  async getStatuts() {
    return this.pointageService.getStatuts();
  }

  // Feuille de pointage d'un salarié : ses pointages du jour `from` au jour
  // `to` (inclus, AAAA-MM-JJ) et ses taux horaires. Déclarée avant
  // pointage/:id pour que « feuille » ne soit pas pris pour un id.
  @Get('pointage/feuille')
  async getFeuille(@Query('personnelId') personnelId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.pointageService.getFeuille(personnelId, from, to);
  }

  @Get('pointage/:id')
  async getPointage(@Param('id', ParseIdPipe) id: bigint) {
    return this.pointageService.getPointage(id);
  }

  @Post('pointage')
  async createPointage(@Body(new ZodBodyPipe(CreatePointageDto)) dto: CreatePointageDto) {
    return this.pointageService.createPointage(dto);
  }

  @Patch('pointage/:id')
  async updatePointage(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdatePointageDto)) dto: UpdatePointageDto) {
    return this.pointageService.updatePointage(id, dto);
  }

  @Delete('pointage/:id')
  async deletePointage(@Param('id', ParseIdPipe) id: bigint) {
    await this.pointageService.deletePointage(id);
  }
}
