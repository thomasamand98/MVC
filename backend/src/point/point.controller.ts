// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PointService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PointService } from './point.service.js';
import type { CreatePointDto, UpdatePointDto } from './point.dto.js';
import { parseProjection } from '../common/projection.js';

@Controller()
export class PointController {
  constructor(private readonly pointService: PointService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir PointService.getPoints pour le détail.
  @Get('points')
  async getPoints(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.pointService.getPoints(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, search, parseProjection(via, ids));
  }

  @Get('points/:id')
  async getPoint(@Param('id') id: string) {
    return this.pointService.getPoint(BigInt(id));
  }

  @Post('points')
  async createPoint(@Body() dto: CreatePointDto) {
    return this.pointService.createPoint(dto);
  }

  @Patch('points/:id')
  async updatePoint(@Param('id') id: string, @Body() dto: UpdatePointDto) {
    return this.pointService.updatePoint(BigInt(id), dto);
  }

  @Delete('points/:id')
  async deletePoint(@Param('id') id: string) {
    await this.pointService.deletePoint(BigInt(id));
  }
}
