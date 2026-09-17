// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (MarchandiseService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MarchandiseService } from './marchandise.service.js';
import type { CreateMarchandiseDto, UpdateMarchandiseDto } from './marchandise.dto.js';

@Controller()
export class MarchandiseController {
  constructor(private readonly marchandiseService: MarchandiseService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir MarchandiseService.getMarchandises pour le détail.
  @Get('marchandises')
  async getMarchandises(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.marchandiseService.getMarchandises(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get('marchandises/:id')
  async getMarchandise(@Param('id') id: string) {
    return this.marchandiseService.getMarchandise(BigInt(id));
  }

  @Post('marchandises')
  async createMarchandise(@Body() dto: CreateMarchandiseDto) {
    return this.marchandiseService.createMarchandise(dto);
  }

  @Patch('marchandises/:id')
  async updateMarchandise(@Param('id') id: string, @Body() dto: UpdateMarchandiseDto) {
    return this.marchandiseService.updateMarchandise(BigInt(id), dto);
  }

  @Delete('marchandises/:id')
  async deleteMarchandise(@Param('id') id: string) {
    await this.marchandiseService.deleteMarchandise(BigInt(id));
  }
}
