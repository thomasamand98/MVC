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
export type CreateDocumentTemplateDto = {
  Nom: string;
  Type_document: DocumentType;
  Description?: string;
  Contenu_entete?: string;
  Contenu_html: string;
  Contenu_pied?: string;
};

export type UpdateDocumentTemplateDto = Partial<CreateDocumentTemplateDto>;
