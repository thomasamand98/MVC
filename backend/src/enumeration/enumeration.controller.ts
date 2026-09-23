// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (EnumerationService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnumerationService } from './enumeration.service.js';
import type { CreateEnumerationDto, UpdateEnumerationDto } from './enumeration.dto.js';

@Controller()
export class EnumerationController {
  constructor(private readonly enumerationService: EnumerationService) {}

  // ?categorieId=12 ou ?categorie=unite_prestation (nom technique) :
  // optionnels — omis, renvoie toute la table.
  @Get('enumerations')
  async getEnumerations(@Query('categorieId') categorieId?: string, @Query('categorie') categorie?: string) {
    return this.enumerationService.getEnumerations(categorieId ? BigInt(categorieId) : undefined, categorie);
  }

  @Post('enumerations')
  async createEnumeration(@Body() dto: CreateEnumerationDto) {
    return this.enumerationService.createEnumeration(dto);
  }

  @Patch('enumerations/:id')
  async updateEnumeration(@Param('id') id: string, @Body() dto: UpdateEnumerationDto) {
    return this.enumerationService.updateEnumeration(BigInt(id), dto);
  }

  @Delete('enumerations/:id')
  async deleteEnumeration(@Param('id') id: string) {
    await this.enumerationService.deleteEnumeration(BigInt(id));
  }
}
