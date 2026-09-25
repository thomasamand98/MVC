// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (DechetService).
import { Controller, Get, Query } from '@nestjs/common';
import { DechetService } from './dechet.service.js';

@Controller()
export class DechetController {
  constructor(private readonly dechetService: DechetService) {}

  // ?search= : filtre sur le code et la description (voir DechetService).
  @Get('dechets')
  async getDechets(@Query('search') search?: string) {
    return this.dechetService.getDechets(search);
  }
}
