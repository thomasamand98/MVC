// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (EntiteService).
// Ressource singleton (une seule ligne en base, voir EntiteService) — pas
// d'id dans les routes, contrairement aux autres features sous src/.
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { EntiteService } from './entite.service.js';
import type { UpdateEntiteDto } from './entite.dto.js';

@Controller()
export class EntiteController {
  constructor(private readonly entiteService: EntiteService) {}

  @Get('entite')
  async getEntite() {
    return this.entiteService.getEntite();
  }

  @Patch('entite')
  async updateEntite(@Body() dto: UpdateEntiteDto) {
    return this.entiteService.updateEntite(dto);
  }
}
