// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (SocietesService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SocietesService } from './societe.service.js';
import { CreateSocieteDto, UpdateSocieteDto } from './societe.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class SocieteController {
  constructor(private readonly societeService: SocietesService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir SocietesService.getSocietes pour le détail.
  @Get('societes')
  async getSocietes(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.societeService.getSocietes(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  @Get('societes/:id')
  async getSociete(@Param('id', ParseIdPipe) id: bigint) {
    return this.societeService.getSociete(id);
  }

  @Post('societes')
  async createSociete(@Body(new ZodBodyPipe(CreateSocieteDto)) dto: CreateSocieteDto) {
    return this.societeService.createSociete(dto);
  }

  @Patch('societes/:id')
  async updateSociete(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateSocieteDto)) dto: UpdateSocieteDto) {
    return this.societeService.updateSociete(id, dto);
  }

  @Delete('societes/:id')
  async deleteSociete(@Param('id', ParseIdPipe) id: bigint) {
    await this.societeService.deleteSociete(id);
  }
}
