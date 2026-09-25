import { z } from 'zod';
import { text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier un modèle de
// document. Mêmes clés que DocumentTemplate côté frontend (voir
// frontend/src/features/documents/types.ts). Type_document désigne le type
// d'enregistrement pour lequel le modèle est utilisable (ex. "CONTRAT") —
// une liste fermée connue du code (voir DOCUMENT_TYPES ci-dessous), pas une
// catégorie d'énumération éditable par l'utilisateur.
export const DOCUMENT_TYPES = ['CONTRAT'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Contenu_entete/Contenu_pied : en-tête et pied de page, répétés sur chaque
// page à l'impression (voir PdfRendererService) — optionnels, un modèle sans
// en-tête/pied n'imprime simplement rien à cet endroit.
export const CreateDocumentTemplateDto = z.object({
  Nom: text,
  Type_document: z.enum(DOCUMENT_TYPES),
  Description: text.optional(),
  Contenu_entete: text.optional(),
  Contenu_html: text,
  Contenu_pied: text.optional(),
});
export type CreateDocumentTemplateDto = z.infer<typeof CreateDocumentTemplateDto>;

export const UpdateDocumentTemplateDto = CreateDocumentTemplateDto.partial();
export type UpdateDocumentTemplateDto = z.infer<typeof UpdateDocumentTemplateDto>;
