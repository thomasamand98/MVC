// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PointService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PointService } from './point.service.js';
import type { CreatePointDto, UpdatePointDto } from './point.dto.js';

@Controller()
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Get('points')
  async getPoints() {
    const points = await this.pointService.getPoints();
    return { points };
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
