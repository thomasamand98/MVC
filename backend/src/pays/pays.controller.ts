// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PaysService).
import { Controller, Get } from '@nestjs/common';
import { PaysService } from './pays.service.js';

@Controller()
export class PaysController {
  constructor(private readonly paysService: PaysService) {}

  @Get('pays')
  async getPays() {
    return this.paysService.getPays();
  }
}
