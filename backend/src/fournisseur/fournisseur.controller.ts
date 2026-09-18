// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (FournisseurService).
import { Controller, Get } from '@nestjs/common';
import { FournisseurService } from './fournisseur.service.js';

@Controller()
export class FournisseurController {
  constructor(private readonly fournisseurService: FournisseurService) {}

  @Get('fournisseurs')
  async getFournisseurs() {
    return this.fournisseurService.getFournisseurs();
  }
}
