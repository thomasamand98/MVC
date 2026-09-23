import { Module } from '@nestjs/common';
import { DocumentTemplateController } from './document-template.controller.js';
import { DocumentTemplateService } from './document-template.service.js';

@Module({
  controllers: [DocumentTemplateController],
  providers: [DocumentTemplateService],
  // Consommé par DocumentMergeModule (résolution du modèle avant fusion).
  exports: [DocumentTemplateService],
})
export class DocumentTemplateModule {}
