import { BadGatewayException, HttpException, HttpStatus, Injectable, Inject, Logger } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { MistralError } from '@mistralai/mistralai/models/errors';

// Extraction structurée demandée en plus de l'OCR : `schema` est un JSON
// Schema (objet racine) que Mistral remplit à partir du document entier,
// `prompt` une consigne optionnelle pour guider ce remplissage.
export type OcrAnnotation = { schema: Record<string, unknown>; prompt?: string };

export type OcrResult = { text: string; annotation: unknown };

@Injectable()
export class MistralService {
  private readonly logger = new Logger(MistralService.name);

  constructor(
    @Inject('MISTRAL_CLIENT') private readonly mistral: Mistral,
  ) {}

  // Traduit une erreur de l'API Mistral en HttpException lisible par le
  // front — sinon AllExceptionsFilter la masque en « Erreur interne du
  // serveur ». Un 401/403 de Mistral (clé invalide) devient un 502 : renvoyé
  // tel quel, le front le prendrait pour une session expirée (voir
  // frontend/src/lib/api.ts).
  private toHttpException(err: unknown): unknown {
    if (!(err instanceof MistralError)) return err;
    this.logger.warn(`Mistral ${err.statusCode} : ${err.body}`);
    if (err.statusCode === 429) {
      return new HttpException('Limite de requêtes Mistral atteinte, réessayez dans quelques instants', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (err.statusCode === 401 || err.statusCode === 403) {
      return new BadGatewayException('Clé API Mistral invalide ou non autorisée (MISTRAL_API_KEY)');
    }
    return new BadGatewayException(`Erreur du service Mistral (statut ${err.statusCode})`);
  }

  // Extrait le texte d'un fichier (PDF ou image) par OCR. Le fichier reçu
  // en binaire est transmis à Mistral en data URI base64, que l'API OCR
  // accepte directement, sans étape d'upload préalable via son API Files.
  // Les images passent par un chunk "image_url", les PDF par "document_url".
  // Renvoie le texte en Markdown (une page par élément du tableau, séparées
  // par une ligne vide) et, si `annotation` est fourni, l'extraction
  // structurée du document entier guidée par `annotation.prompt` (JSON
  // conforme à `annotation.schema`, déjà parsé).
  async runOcr(file: Buffer, mimeType: string, annotation?: OcrAnnotation): Promise<OcrResult> {
    const dataUri = `data:${mimeType};base64,${file.toString('base64')}`;
    const response = await this.mistral.ocr
      .process({
        model: 'mistral-ocr-latest',
        document: mimeType.startsWith('image/')
          ? { type: 'image_url', imageUrl: dataUri }
          : { type: 'document_url', documentUrl: dataUri },
        // Tous les paramètres de l'API OCR, avec leur valeur par défaut
        // (null/false = comportement de l'API quand le champ est absent).
        // Pages à traiter (index à partir de 0) : '0-4', '0,2-4' ou [0, 2].
        // null = toutes les pages.
        pages: null,
        // Renvoie les images extraites en base64 dans page.images.
        includeImageBase64: false,
        // Nombre max d'images extraites. null = pas de limite.
        imageLimit: null,
        // Hauteur/largeur min (px) d'une image pour être extraite. null = aucune.
        imageMinSize: null,
        // Format des tableaux : 'markdown' | 'html'. null = tableaux laissés
        // dans le markdown de la page.
        tableFormat: null,
        // Sort l'en-tête / le pied de page dans page.header / page.footer et
        // les retire du markdown (qui est le seul champ renvoyé ici).
        extractHeader: false,
        extractFooter: false,
        // Boîtes englobantes par paragraphe dans la réponse.
        includeBlocks: false,
        // Scores de confiance : 'page' | 'word' | 'block'. null = aucun
        // (réponse plus légère).
        confidenceScoresGranularity: null,
        // Extraction structurée (json_schema uniquement) : sur chaque image /
        // boîte englobante, et sur le document entier (avec un prompt
        // optionnel, qui exige documentAnnotationFormat).
        bboxAnnotationFormat: null,
        documentAnnotationFormat: annotation
          ? { type: 'json_schema', jsonSchema: { name: 'extraction', schemaDefinition: annotation.schema, strict: true } }
          : null,
        documentAnnotationPrompt: annotation?.prompt || null,
      })
      .catch((err: unknown) => {
        throw this.toHttpException(err);
      });

    return {
      text: response.pages.map((page) => page.markdown).join('\n\n'),
      annotation: response.documentAnnotation ? (JSON.parse(response.documentAnnotation) as unknown) : null,
    };
  }
}