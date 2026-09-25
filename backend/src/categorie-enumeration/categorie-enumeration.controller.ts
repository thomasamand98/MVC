// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model
// (CategorieEnumerationService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategorieEnumerationService } from './categorie-enumeration.service.js';
import { CreateCategorieEnumerationDto, UpdateCategorieEnumerationDto } from './categorie-enumeration.dto.js';
import { ParseIdPipe } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class CategorieEnumerationController {
  constructor(private readonly categorieEnumerationService: CategorieEnumerationService) {}

  @Get('categories-enumeration')
  async getCategoriesEnumeration() {
    return this.categorieEnumerationService.getCategoriesEnumeration();
  }

  @Post('categories-enumeration')
  async createCategorieEnumeration(@Body(new ZodBodyPipe(CreateCategorieEnumerationDto)) dto: CreateCategorieEnumerationDto) {
    return this.categorieEnumerationService.createCategorieEnumeration(dto);
  }

  @Patch('categories-enumeration/:id')
  async updateCategorieEnumeration(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateCategorieEnumerationDto)) dto: UpdateCategorieEnumerationDto) {
    return this.categorieEnumerationService.updateCategorieEnumeration(id, dto);
  }

  @Delete('categories-enumeration/:id')
  async deleteCategorieEnumeration(@Param('id', ParseIdPipe) id: bigint) {
    await this.categorieEnumerationService.deleteCategorieEnumeration(id);
  }
}
