import { Module } from '@nestjs/common';
import { CategorieEnumerationController } from './categorie-enumeration.controller.js';
import { CategorieEnumerationService } from './categorie-enumeration.service.js';

@Module({
  controllers: [CategorieEnumerationController],
  providers: [CategorieEnumerationService],
})
export class CategorieEnumerationModule {}
