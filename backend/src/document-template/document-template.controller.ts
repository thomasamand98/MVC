// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (DocumentTemplateService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DocumentTemplateService } from './document-template.service.js';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto } from './document-template.dto.js';
import { ParseIdPipe } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

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
  async getDocumentTemplate(@Param('id', ParseIdPipe) id: bigint) {
    return this.documentTemplateService.getDocumentTemplate(id);
  }

  @Post('document-templates')
  async createDocumentTemplate(@Body(new ZodBodyPipe(CreateDocumentTemplateDto)) dto: CreateDocumentTemplateDto) {
    return this.documentTemplateService.createDocumentTemplate(dto);
  }

  @Patch('document-templates/:id')
  async updateDocumentTemplate(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateDocumentTemplateDto)) dto: UpdateDocumentTemplateDto) {
    return this.documentTemplateService.updateDocumentTemplate(id, dto);
  }

  @Delete('document-templates/:id')
  async deleteDocumentTemplate(@Param('id', ParseIdPipe) id: bigint) {
    await this.documentTemplateService.deleteDocumentTemplate(id);
  }
}
