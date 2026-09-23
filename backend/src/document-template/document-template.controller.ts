// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (DocumentTemplateService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DocumentTemplateService } from './document-template.service.js';
import type { CreateDocumentTemplateDto, UpdateDocumentTemplateDto } from './document-template.dto.js';

@Controller()
export class DocumentTemplateController {
  constructor(private readonly documentTemplateService: DocumentTemplateService) {}

  // ?type=CONTRAT : optionnel, ne renvoie que les modèles utilisables pour
  // ce type de document (voir DocumentTemplateService.getDocumentTemplates).
  @Get('document-templates')
  async getDocumentTemplates(@Query('type') type?: string) {
    return this.documentTemplateService.getDocumentTemplates(type);
  }

  @Get('document-templates/:id')
  async getDocumentTemplate(@Param('id') id: string) {
    return this.documentTemplateService.getDocumentTemplate(BigInt(id));
  }

  @Post('document-templates')
  async createDocumentTemplate(@Body() dto: CreateDocumentTemplateDto) {
    return this.documentTemplateService.createDocumentTemplate(dto);
  }

  @Patch('document-templates/:id')
  async updateDocumentTemplate(@Param('id') id: string, @Body() dto: UpdateDocumentTemplateDto) {
    return this.documentTemplateService.updateDocumentTemplate(BigInt(id), dto);
  }

  @Delete('document-templates/:id')
  async deleteDocumentTemplate(@Param('id') id: string) {
    await this.documentTemplateService.deleteDocumentTemplate(BigInt(id));
  }
}
