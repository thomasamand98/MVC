// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (SocietesService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SocietesService } from './societe.service.js';
import type { CreateSocieteDto, UpdateSocieteDto } from './societe.dto.js';

@Controller()
export class SocieteController {
  constructor(private readonly societeService: SocietesService) {}

  @Get('societes')
  async getSocietes() {
    const societes = await this.societeService.getSocietes();
    return { societes };
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
