// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (VilleService).
import { Controller, Get, Query } from '@nestjs/common';
import { VilleService } from './ville.service.js';

@Controller()
export class VilleController {
  constructor(private readonly villeService: VilleService) {}

  // ?cp=7390 — requis : pas de liste complète, voir VilleService.
  @Get('villes')
  async getVilles(@Query('cp') cp?: string) {
    if (!cp) return { villes: [] };
    return this.villeService.searchVilles(cp);
  }
}
