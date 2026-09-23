// ===== MODEL (logique métier) =====
// Modèles de document imprimables (table document_templates), créés depuis
// l'éditeur front (voir frontend/src/features/documents/) et consommés par
// le moteur de fusion (voir backend/src/document-merge/). Appelé uniquement
// par DocumentTemplateController — jamais par la View directement.
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto } from './document-template.dto.js';

// Select « liste » : sans Contenu_html (potentiellement volumineux — mise en
// page HTML complète), pour ne pas l'envoyer tant que l'éditeur n'est pas
// ouvert sur ce modèle précis. Voir documentTemplateDetailSelect pour le
// GET /document-templates/:id complet.
export const documentTemplateSelect = {
  IDDOCUMENT_TEMPLATES: true,
  Nom: true,
  Type_document: true,
  Description: true,
  Date_heure_creation: true,
  Date_heure_modification: true,
} satisfies Prisma.DocumentTemplateSelect;

export const documentTemplateDetailSelect = {
  ...documentTemplateSelect,
  Contenu_entete: true,
  Contenu_html: true,
  Contenu_pied: true,
} satisfies Prisma.DocumentTemplateSelect;

// Les trois zones d'un modèle (voir DocumentTemplateEditor.tsx : en-tête /
// contenu / pied, chacune éditée indépendamment).
export type DocumentTemplateContent = {
  Contenu_entete: string | null;
  Contenu_html: string;
  Contenu_pied: string | null;
};

@Injectable()
export class DocumentTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  // `type` optionnel (ex. "CONTRAT") : ne renvoie que les modèles
  // utilisables pour ce type de document — c'est ce que la fiche contrat
  // demande pour peupler son sélecteur « Voir le PDF ».
  async getDocumentTemplates(type?: string) {
    const documentTemplates = await this.prisma.documentTemplate.findMany({
      where: type ? { Type_document: type } : undefined,
      orderBy: { Nom: 'asc' },
      select: documentTemplateSelect,
    });
    return { documentTemplates: serializeBigInt(documentTemplates) };
  }

  async getDocumentTemplate(id: bigint) {
    const documentTemplate = await this.prisma.documentTemplate.findUnique({
      where: { IDDOCUMENT_TEMPLATES: id },
      select: documentTemplateDetailSelect,
    });
    if (!documentTemplate) throw new NotFoundException('Modèle de document introuvable');
    return serializeBigInt(documentTemplate);
  }

  // Renvoie le HTML brut des trois zones (non serialisé), pour le moteur de
  // fusion — qui n'a pas besoin du reste de la fiche (voir DocumentMergeService).
  async getDocumentTemplateContent(id: bigint): Promise<DocumentTemplateContent> {
    const documentTemplate = await this.prisma.documentTemplate.findUnique({
      where: { IDDOCUMENT_TEMPLATES: id },
      select: { Contenu_entete: true, Contenu_html: true, Contenu_pied: true },
    });
    if (!documentTemplate) throw new NotFoundException('Modèle de document introuvable');
    return documentTemplate;
  }

  async createDocumentTemplate(dto: CreateDocumentTemplateDto) {
    const documentTemplate = await this.prisma.documentTemplate.create({
      // IDUTILISATEURS_createur/modificateur ont un défaut DB de 0, qui viole
      // leur contrainte de clé étrangère (aucun utilisateur d'id 0) quand ils
      // sont omis — mis explicitement à NULL (pas encore d'authentification
      // pour les renseigner).
      data: {
        ...dto,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
        Date_heure_creation: new Date(),
        Date_heure_modification: new Date(),
      },
      select: documentTemplateDetailSelect,
    });
    return serializeBigInt(documentTemplate);
  }

  async updateDocumentTemplate(id: bigint, dto: UpdateDocumentTemplateDto) {
    const documentTemplate = await this.prisma.documentTemplate.update({
      where: { IDDOCUMENT_TEMPLATES: id },
      data: { ...dto, Date_heure_modification: new Date() },
      select: documentTemplateDetailSelect,
    });
    return serializeBigInt(documentTemplate);
  }

  async deleteDocumentTemplate(id: bigint) {
    await this.prisma.documentTemplate.delete({ where: { IDDOCUMENT_TEMPLATES: id } });
  }
}
