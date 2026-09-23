// ===== MODEL (orchestration) =====
// Point d'entrée du moteur de fusion : assemble le modèle (DocumentTemplateService)
// et un contexte de données déjà construit par l'appelant (voir
// contrat.service.ts, getContratMergeContext) pour produire un PDF. Ne
// connaît rien du contrat, de la facture ou de tout autre type
// d'enregistrement — chaque module métier (Contrat, Facture...) fournit son
// propre contexte, dans la même forme que ses chemins de fusion côté front
// (voir frontend/src/features/documents/mergeFields.ts), et appelle
// `renderPdf` avec l'id du modèle choisi par l'utilisateur.
//
// Un modèle a trois zones indépendantes (voir DocumentTemplateEditor.tsx) :
// en-tête et pied de page (répétés sur chaque page imprimée) et le contenu
// principal (affiché une fois). Les trois sont résolues avec exactement le
// même contexte — un modèle qui met, par exemple, {{ Contrat.Num_contrat }}
// dans son pied de page fonctionne aussi naturellement qu'un champ posé dans
// le contenu.
import { Injectable } from '@nestjs/common';
import { DocumentTemplateService } from '../document-template/document-template.service.js';
import { resolveMergeHtml, type MergeContext } from './merge-html.js';
import { PdfRendererService } from './pdf-renderer.service.js';

@Injectable()
export class DocumentMergeService {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly pdfRendererService: PdfRendererService,
  ) {}

  async renderPdf(templateId: bigint, context: MergeContext): Promise<Buffer> {
    const content = await this.documentTemplateService.getDocumentTemplateContent(templateId);
    return this.pdfRendererService.renderPdf({
      headerHtml: content.Contenu_entete ? resolveMergeHtml(content.Contenu_entete, context) : '',
      bodyHtml: resolveMergeHtml(content.Contenu_html, context),
      footerHtml: content.Contenu_pied ? resolveMergeHtml(content.Contenu_pied, context) : '',
    });
  }
}
