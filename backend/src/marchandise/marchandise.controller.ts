// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (MarchandiseService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MarchandiseService } from './marchandise.service.js';
import { CreateMarchandiseDto, UpdateMarchandiseDto } from './marchandise.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class MarchandiseController {
  constructor(private readonly marchandiseService: MarchandiseService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir MarchandiseService.getMarchandises pour le détail.
  @Get('marchandises')
  async getMarchandises(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.marchandiseService.getMarchandises(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  @Get('marchandises/:id')
  async getMarchandise(@Param('id', ParseIdPipe) id: bigint) {
    return this.marchandiseService.getMarchandise(id);
  }

  @Post('marchandises')
  async createMarchandise(@Body(new ZodBodyPipe(CreateMarchandiseDto)) dto: CreateMarchandiseDto) {
    return this.marchandiseService.createMarchandise(dto);
  }

  @Patch('marchandises/:id')
  async updateMarchandise(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateMarchandiseDto)) dto: UpdateMarchandiseDto) {
    return this.marchandiseService.updateMarchandise(id, dto);
  }

  @Delete('marchandises/:id')
  async deleteMarchandise(@Param('id', ParseIdPipe) id: bigint) {
    await this.marchandiseService.deleteMarchandise(id);
  }
}
