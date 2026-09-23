import { Module } from '@nestjs/common';
import { EntiteController } from './entite.controller.js';
import { EntiteService } from './entite.service.js';

@Module({
  controllers: [EntiteController],
  providers: [EntiteService],
  // Consommé par ContratModule (coordonnées de l'émetteur pour la fusion PDF).
  exports: [EntiteService],
})
export class EntiteModule {}
