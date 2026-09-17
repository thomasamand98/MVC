// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PointageService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PointageService } from './pointage.service.js';
import type { CreatePointageDto, UpdatePointageDto } from './pointage.dto.js';

@Controller()
export class PointageController {
  constructor(private readonly pointageService: PointageService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir PointageService.getPointages pour le détail.
  @Get('pointage')
  async getPointages(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.pointageService.getPointages(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get('pointage/:id')
  async getPointage(@Param('id') id: string) {
    return this.pointageService.getPointage(BigInt(id));
  }

  @Post('pointage')
  async createPointage(@Body() dto: CreatePointageDto) {
    return this.pointageService.createPointage(dto);
  }

  @Patch('pointage/:id')
  async updatePointage(@Param('id') id: string, @Body() dto: UpdatePointageDto) {
    return this.pointageService.updatePointage(BigInt(id), dto);
  }

  @Delete('pointage/:id')
  async deletePointage(@Param('id') id: string) {
    await this.pointageService.deletePointage(BigInt(id));
  }
}
