// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (AttelageService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AttelageService } from './attelage.service.js';
import type { CreateAttelageDto, UpdateAttelageDto } from './attelage.dto.js';
import { parseProjection } from '../common/projection.js';

@Controller()
export class AttelageController {
  constructor(private readonly attelageService: AttelageService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir AttelageService.getAttelages pour le détail.
  @Get('attelages')
  async getAttelages(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.attelageService.getAttelages(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, search, parseProjection(via, ids));
  }

  @Get('attelages/:id')
  async getAttelage(@Param('id') id: string) {
    return this.attelageService.getAttelage(BigInt(id));
  }

  @Post('attelages')
  async createAttelage(@Body() dto: CreateAttelageDto) {
    return this.attelageService.createAttelage(dto);
  }

  @Patch('attelages/:id')
  async updateAttelage(@Param('id') id: string, @Body() dto: UpdateAttelageDto) {
    return this.attelageService.updateAttelage(BigInt(id), dto);
  }

  @Delete('attelages/:id')
  async deleteAttelage(@Param('id') id: string) {
    await this.attelageService.deleteAttelage(BigInt(id));
  }
}
