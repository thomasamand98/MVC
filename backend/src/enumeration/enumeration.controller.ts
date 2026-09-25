// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (EnumerationService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnumerationService } from './enumeration.service.js';
import { CreateEnumerationDto, UpdateEnumerationDto } from './enumeration.dto.js';
import { OptionalIdPipe, ParseIdPipe } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class EnumerationController {
  constructor(private readonly enumerationService: EnumerationService) {}

  // ?categorieId=12 ou ?categorie=unite_prestation (nom technique) :
  // optionnels — omis, renvoie toute la table.
  @Get('enumerations')
  async getEnumerations(@Query('categorieId', OptionalIdPipe) categorieId?: bigint, @Query('categorie') categorie?: string) {
    return this.enumerationService.getEnumerations(categorieId, categorie);
  }

  @Post('enumerations')
  async createEnumeration(@Body(new ZodBodyPipe(CreateEnumerationDto)) dto: CreateEnumerationDto) {
    return this.enumerationService.createEnumeration(dto);
  }

  @Patch('enumerations/:id')
  async updateEnumeration(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateEnumerationDto)) dto: UpdateEnumerationDto) {
    return this.enumerationService.updateEnumeration(id, dto);
  }

  @Delete('enumerations/:id')
  async deleteEnumeration(@Param('id', ParseIdPipe) id: bigint) {
    await this.enumerationService.deleteEnumeration(id);
  }
}
