// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (CommandeService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandeService } from './commande.service.js';
import type { CreateCommandeDto, UpdateCommandeDto } from './commande.dto.js';

@Controller()
export class CommandeController {
  constructor(private readonly commandeService: CommandeService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir CommandeService.getCommandes pour le détail.
  @Get('commandes')
  async getCommandes(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.commandeService.getCommandes(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get('commandes/:id')
  async getCommande(@Param('id') id: string) {
    return this.commandeService.getCommande(BigInt(id));
  }

  @Post('commandes')
  async createCommande(@Body() dto: CreateCommandeDto) {
    return this.commandeService.createCommande(dto);
  }

  @Patch('commandes/:id')
  async updateCommande(@Param('id') id: string, @Body() dto: UpdateCommandeDto) {
    return this.commandeService.updateCommande(BigInt(id), dto);
  }

  @Delete('commandes/:id')
  async deleteCommande(@Param('id') id: string) {
    await this.commandeService.deleteCommande(BigInt(id));
  }
}
