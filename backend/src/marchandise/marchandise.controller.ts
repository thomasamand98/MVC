// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (MarchandiseService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { MarchandiseService } from './marchandise.service.js';
import type { CreateMarchandiseDto, UpdateMarchandiseDto } from './marchandise.dto.js';

@Controller()
export class MarchandiseController {
  constructor(private readonly marchandiseService: MarchandiseService) {}

  @Get('marchandises')
  async getMarchandises() {
    const marchandises = await this.marchandiseService.getMarchandises();
    return { marchandises };
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
