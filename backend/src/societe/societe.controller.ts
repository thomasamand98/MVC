// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (SocietesService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SocietesService } from './societe.service.js';
import type { CreateSocieteDto, UpdateSocieteDto } from './societe.dto.js';
import { parseProjection } from '../common/projection.js';

@Controller()
export class SocieteController {
  constructor(private readonly societeService: SocietesService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir SocietesService.getSocietes pour le détail.
  @Get('societes')
  async getSocietes(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.societeService.getSocietes(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, search, parseProjection(via, ids));
  }

  @Get('societes/:id')
  async getSociete(@Param('id') id: string) {
    return this.societeService.getSociete(BigInt(id));
  }

  @Post('societes')
  async createSociete(@Body() dto: CreateSocieteDto) {
    return this.societeService.createSociete(dto);
  }

  @Patch('societes/:id')
  async updateSociete(@Param('id') id: string, @Body() dto: UpdateSocieteDto) {
    return this.societeService.updateSociete(BigInt(id), dto);
  }

  @Delete('societes/:id')
  async deleteSociete(@Param('id') id: string) {
    await this.societeService.deleteSociete(BigInt(id));
  }
}
