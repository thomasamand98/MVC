// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContratService).
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ContratService } from './contrat.service.js';
import type { CreateContratDto, UpdateContratDto } from './contrat.dto.js';
import { DocumentMergeService } from '../document-merge/document-merge.service.js';

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
  async getContrats(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('societeId') societeId?: string) {
    return this.contratService.getContrats(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, societeId);
  }

  @Get('contrats/:id')
  async getContrat(@Param('id') id: string) {
    return this.contratService.getContrat(BigInt(id));
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
  async getContratPdf(@Param('id') id: string, @Query('templateId') templateId: string | undefined, @Res() res: Response) {
    if (!templateId) throw new BadRequestException('templateId requis');
    const context = await this.contratService.getContratMergeContext(BigInt(id));
    const pdf = await this.documentMergeService.renderPdf(BigInt(templateId), context);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="contrat-${id}.pdf"` });
    res.send(pdf);
  }

  @Post('contrats')
  async createContrat(@Body() dto: CreateContratDto) {
    return this.contratService.createContrat(dto);
  }

  @Patch('contrats/:id')
  async updateContrat(@Param('id') id: string, @Body() dto: UpdateContratDto) {
    return this.contratService.updateContrat(BigInt(id), dto);
  }

  @Delete('contrats/:id')
  async deleteContrat(@Param('id') id: string) {
    await this.contratService.deleteContrat(BigInt(id));
  }
}
