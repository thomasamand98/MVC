// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model
// (CategorieEnumerationService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategorieEnumerationService } from './categorie-enumeration.service.js';
import type { CreateCategorieEnumerationDto, UpdateCategorieEnumerationDto } from './categorie-enumeration.dto.js';

@Controller()
export class CategorieEnumerationController {
  constructor(private readonly categorieEnumerationService: CategorieEnumerationService) {}

  @Get('categories-enumeration')
  async getCategoriesEnumeration() {
    return this.categorieEnumerationService.getCategoriesEnumeration();
  }

  @Post('categories-enumeration')
  async createCategorieEnumeration(@Body() dto: CreateCategorieEnumerationDto) {
    return this.categorieEnumerationService.createCategorieEnumeration(dto);
  }

  @Patch('categories-enumeration/:id')
  async updateCategorieEnumeration(@Param('id') id: string, @Body() dto: UpdateCategorieEnumerationDto) {
    return this.categorieEnumerationService.updateCategorieEnumeration(BigInt(id), dto);
  }

  @Delete('categories-enumeration/:id')
  async deleteCategorieEnumeration(@Param('id') id: string) {
    await this.categorieEnumerationService.deleteCategorieEnumeration(BigInt(id));
  }
}
