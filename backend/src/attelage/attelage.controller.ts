// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (AttelageService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AttelageService } from './attelage.service.js';
import { CreateAttelageDto, UpdateAttelageDto } from './attelage.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class AttelageController {
  constructor(private readonly attelageService: AttelageService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir AttelageService.getAttelages pour le détail.
  @Get('attelages')
  async getAttelages(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.attelageService.getAttelages(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  @Get('attelages/:id')
  async getAttelage(@Param('id', ParseIdPipe) id: bigint) {
    return this.attelageService.getAttelage(id);
  }

  @Post('attelages')
  async createAttelage(@Body(new ZodBodyPipe(CreateAttelageDto)) dto: CreateAttelageDto) {
    return this.attelageService.createAttelage(dto);
  }

  @Patch('attelages/:id')
  async updateAttelage(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateAttelageDto)) dto: UpdateAttelageDto) {
    return this.attelageService.updateAttelage(id, dto);
  }

  @Delete('attelages/:id')
  async deleteAttelage(@Param('id', ParseIdPipe) id: bigint) {
    await this.attelageService.deleteAttelage(id);
  }
}
