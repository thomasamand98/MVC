// Modèle de document, tel que renvoyé par l'API (voir
// backend/src/document-template/document-template.service.ts,
// documentTemplateSelect/documentTemplateDetailSelect). IDDOCUMENT_TEMPLATES
// est un BigInt côté Prisma, converti en string côté service. Le contenu
// (Contenu_html) est le HTML du canvas de DocumentTemplateEditor, avec les
// champs de fusion sous forme de jetons
// <span data-merge-field="Contrat.Num_contrat">…</span> et les blocs
// répétables sous forme de <div data-repeat-list="Contrat.Prestations[]">…
// </div> — résolu côté backend par le moteur de fusion (voir
// backend/src/document-merge/) pour produire le PDF.
//
// Type_document désigne le type d'enregistrement pour lequel le modèle est
// utilisable — une liste fermée connue du code (voir DOCUMENT_TYPES), pas
// une catégorie d'énumération éditable par l'utilisateur. Un seul type pour
// l'instant : les modèles de contrat.
export const DOCUMENT_TYPES = ['CONTRAT'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

// Libellé affiché dans le sélecteur de type (voir DocumentTemplatesPage.tsx,
// modale de création) — à compléter au même rythme que DOCUMENT_TYPES.
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CONTRAT: 'Contrat',
}

export type DocumentTemplateSummary = {
  IDDOCUMENT_TEMPLATES: string
  Nom: string
  Type_document: string
  Description: string | null
  Date_heure_creation: string | null
  Date_heure_modification: string | null
}

// Forme renvoyée par GET /document-templates/:id — avec le HTML complet des
// trois zones (voir DocumentTemplateEditor.tsx), absent de la liste (voir
// DocumentTemplatesPage.tsx) pour ne pas l'envoyer tant que l'éditeur n'est
// pas ouvert sur ce modèle précis. Contenu_entete/Contenu_pied sont répétés
// sur chaque page à l'impression (voir backend/src/document-merge/pdf-renderer.service.ts).
export type DocumentTemplateDetail = DocumentTemplateSummary & {
  Contenu_entete: string | null
  Contenu_html: string
  Contenu_pied: string | null
}

// Champs scripturables, mêmes clés que CreateDocumentTemplateDto côté
// backend.
export type DocumentTemplateDto = {
  Nom: string
  Type_document: DocumentType
  Description: string
  Contenu_entete: string
  Contenu_html: string
  Contenu_pied: string
}
