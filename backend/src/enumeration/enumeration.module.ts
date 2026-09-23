import { Module } from '@nestjs/common';
import { EnumerationController } from './enumeration.controller.js';
import { EnumerationService } from './enumeration.service.js';

@Module({
  controllers: [EnumerationController],
  providers: [EnumerationService],
  // Consommé par ContratModule (libellés d'unité pour la fusion PDF).
  exports: [EnumerationService],
})
export class EnumerationModule {}
