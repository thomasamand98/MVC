import { Module } from '@nestjs/common';
import { FournisseurController } from './fournisseur.controller.js';
import { FournisseurService } from './fournisseur.service.js';

@Module({
  controllers: [FournisseurController],
  providers: [FournisseurService],
})
export class FournisseurModule {}
