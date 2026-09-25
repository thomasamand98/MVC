// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContratService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ContratService } from './contrat.service.js';
import { CreateContratDto, UpdateContratDto } from './contrat.dto.js';
import { DocumentMergeService } from '../document-merge/document-merge.service.js';
import { parseProjection } from '../common/projection.js';
import { OptionalIdPipe, ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class ContratController {
  constructor(
    private readonly contratService: ContratService,
    private readonly documentMergeService: DocumentMergeService,
  ) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). ?societeId=X : optionnel, ne renvoie que les contrats de cette
  // société. Voir ContratService.getContrats pour le détail.
  @Get('contrats')
  async getContrats(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('societeId', OptionalIdPipe) societeId?: bigint, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.contratService.getContrats(parsePage(page), parsePageSize(pageSize), societeId, search, parseProjection(via, ids));
  }

  @Get('contrats/:id')
  async getContrat(@Param('id', ParseIdPipe) id: bigint) {
    return this.contratService.getContrat(id);
  }

  // Prestations d'un contrat (sélecteur « Prestations » de la fiche
  // commande) — sans le reste de la fiche contrat.
  @Get('contrats/:id/prestations')
  async getContratPrestations(@Param('id', ParseIdPipe) id: bigint) {
    return this.contratService.getContratPrestations(id);
  }

  // ?templateId= (obligatoire) : id du modèle de document choisi dans la
  // fiche (voir ContratPdfButton.tsx côté front, /document-templates?type=CONTRAT
  // pour la liste des modèles proposés). Renvoie le PDF fusionné, affichable
  // directement dans un onglet (voir DocumentMergeService).
  //
  // `@Res()` sans `passthrough` : Nest n'intercepte alors plus la réponse
  // pour la sérialiser en JSON (ce qu'il ferait même en `passthrough: true`
  // avec un `return`) — nécessaire pour envoyer le Buffer du PDF tel quel.
  @Get('contrats/:id/pdf')
  async getContratPdf(@Param('id', ParseIdPipe) id: bigint, @Query('templateId', ParseIdPipe) templateId: bigint, @Res() res: Response) {
    const context = await this.contratService.getContratMergeContext(id);
    const pdf = await this.documentMergeService.renderPdf(templateId, context);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="contrat-${id}.pdf"` });
    res.send(pdf);
  }

  @Post('contrats')
  async createContrat(@Body(new ZodBodyPipe(CreateContratDto)) dto: CreateContratDto) {
    return this.contratService.createContrat(dto);
  }

  @Patch('contrats/:id')
  async updateContrat(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateContratDto)) dto: UpdateContratDto) {
    return this.contratService.updateContrat(id, dto);
  }

  @Delete('contrats/:id')
  async deleteContrat(@Param('id', ParseIdPipe) id: bigint) {
    await this.contratService.deleteContrat(id);
  }
}
