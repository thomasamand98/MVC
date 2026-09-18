// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ClientService).
import { Controller, Get } from '@nestjs/common';
import { ClientService } from './client.service.js';

@Controller()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('clients')
  async getClients() {
    return this.clientService.getClients();
  }
}
