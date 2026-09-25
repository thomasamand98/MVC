// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (VehiculeService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VehiculeService } from './vehicule.service.js';
import { CreateVehiculeDto, UpdateVehiculeDto } from './vehicule.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class VehiculeController {
  constructor(private readonly vehiculeService: VehiculeService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir VehiculeService.getVehicules pour le détail.
  @Get('vehicules')
  async getVehicules(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.vehiculeService.getVehicules(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  @Get('vehicules/:id')
  async getVehicule(@Param('id', ParseIdPipe) id: bigint) {
    return this.vehiculeService.getVehicule(id);
  }

  @Post('vehicules')
  async createVehicule(@Body(new ZodBodyPipe(CreateVehiculeDto)) dto: CreateVehiculeDto) {
    return this.vehiculeService.createVehicule(dto);
  }

  @Patch('vehicules/:id')
  async updateVehicule(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateVehiculeDto)) dto: UpdateVehiculeDto) {
    return this.vehiculeService.updateVehicule(id, dto);
  }

  @Delete('vehicules/:id')
  async deleteVehicule(@Param('id', ParseIdPipe) id: bigint) {
    await this.vehiculeService.deleteVehicule(id);
  }
}
