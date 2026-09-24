// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (VehiculeService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VehiculeService } from './vehicule.service.js';
import type { CreateVehiculeDto, UpdateVehiculeDto } from './vehicule.dto.js';
import { parseProjection } from '../common/projection.js';

@Controller()
export class VehiculeController {
  constructor(private readonly vehiculeService: VehiculeService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir VehiculeService.getVehicules pour le détail.
  @Get('vehicules')
  async getVehicules(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.vehiculeService.getVehicules(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, search, parseProjection(via, ids));
  }

  @Get('vehicules/:id')
  async getVehicule(@Param('id') id: string) {
    return this.vehiculeService.getVehicule(BigInt(id));
  }

  @Post('vehicules')
  async createVehicule(@Body() dto: CreateVehiculeDto) {
    return this.vehiculeService.createVehicule(dto);
  }

  @Patch('vehicules/:id')
  async updateVehicule(@Param('id') id: string, @Body() dto: UpdateVehiculeDto) {
    return this.vehiculeService.updateVehicule(BigInt(id), dto);
  }

  @Delete('vehicules/:id')
  async deleteVehicule(@Param('id') id: string) {
    await this.vehiculeService.deleteVehicule(BigInt(id));
  }
}
