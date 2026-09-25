// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (CommandeService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandeService } from './commande.service.js';
import { CreateCommandeDto, UpdateCommandeDto } from './commande.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize, parsePeriod } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class CommandeController {
  constructor(private readonly commandeService: CommandeService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). ?from=&to= (AAAA-MM-JJ, inclus) : commandes dont la
  // Date_commande tombe dans la période, absents = toutes. Voir
  // CommandeService.getCommandes pour le détail.
  @Get('commandes')
  async getCommandes(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.commandeService.getCommandes(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids), parsePeriod(from, to));
  }

  @Get('commandes/:id')
  async getCommande(@Param('id', ParseIdPipe) id: bigint) {
    return this.commandeService.getCommande(id);
  }

  @Post('commandes')
  async createCommande(@Body(new ZodBodyPipe(CreateCommandeDto)) dto: CreateCommandeDto) {
    return this.commandeService.createCommande(dto);
  }

  @Patch('commandes/:id')
  async updateCommande(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateCommandeDto)) dto: UpdateCommandeDto) {
    return this.commandeService.updateCommande(id, dto);
  }

  @Delete('commandes/:id')
  async deleteCommande(@Param('id', ParseIdPipe) id: bigint) {
    await this.commandeService.deleteCommande(id);
  }
}
