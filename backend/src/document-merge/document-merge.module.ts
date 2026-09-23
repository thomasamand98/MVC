import { Module } from '@nestjs/common';
import { DocumentTemplateModule } from '../document-template/document-template.module.js';
import { DocumentMergeService } from './document-merge.service.js';
import { PdfRendererService } from './pdf-renderer.service.js';

// Importé par chaque module métier qui expose un « Voir le PDF » (Contrat
// aujourd'hui — voir contrat.module.ts ; Facture, Contact... plus tard,
// selon le même principe).
@Module({
  imports: [DocumentTemplateModule],
  providers: [DocumentMergeService, PdfRendererService],
  exports: [DocumentMergeService],
})
export class DocumentMergeModule {}
