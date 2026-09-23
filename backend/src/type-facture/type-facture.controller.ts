// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (TypeFactureService).
import { Controller, Get } from '@nestjs/common';
import { TypeFactureService } from './type-facture.service.js';

@Controller()
export class TypeFactureController {
  constructor(private readonly typeFactureService: TypeFactureService) {}

  @Get('types-facture')
  async getTypesFacture() {
    return this.typeFactureService.getTypesFacture();
  }
}
