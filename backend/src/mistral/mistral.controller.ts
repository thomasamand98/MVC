// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (MistralService).
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MistralService, type OcrAnnotation } from './mistral.service.js';

// Upload multipart (champ "file") plutôt qu'une data URI base64 dans le
// JSON : le fichier voyage en binaire (pas de surcoût de ~33 %) et n'est pas
// soumis à la limite globale de 10 Mo d'express.json() (voir main.ts) — la
// limite ci-dessous ne concerne que cette route. 50 Mo = taille max
// acceptée par l'API OCR de Mistral ; au-delà, Multer répond 413.
const MAX_OCR_FILE_SIZE = 50 * 1024 * 1024;

// Seuls champs lus du fichier fourni par Multer — typés ici plutôt que via
// le type global Express.Multer.File, qui exigerait @types/multer.
type UploadedOcrFile = { buffer: Buffer; mimetype: string };

@Controller('mistral')
export class MistralController {
  constructor(private readonly mistralService: MistralService) {}

  @Post('ocr')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_OCR_FILE_SIZE, files: 1 } }))
  async ocr(@UploadedFile() file: UploadedOcrFile | undefined, @Body() body: OcrFields) {
    if (!file) throw new BadRequestException('Fichier requis (champ "file")');
    if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
      throw new UnsupportedMediaTypeException('Seuls les PDF et les images sont acceptés');
    }
    return this.mistralService.runOcr(file.buffer, file.mimetype, parseAnnotation(body));
  }
}

// Champs texte optionnels envoyés avec le fichier dans le multipart : un
// JSON Schema (sous forme de chaîne) pour l'extraction structurée, et la
// consigne qui la guide — voir OcrAnnotation dans mistral.service.ts.
type OcrFields = { schema?: string; prompt?: string };

function parseAnnotation({ schema, prompt }: OcrFields): OcrAnnotation | undefined {
  if (!schema?.trim()) {
    // Mistral refuse un prompt d'annotation sans schéma de sortie.
    if (prompt?.trim()) throw new BadRequestException('Un prompt exige un schéma JSON (champ "schema")');
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(schema);
  } catch {
    throw new BadRequestException("Le schéma JSON n'est pas un JSON valide");
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new BadRequestException('Le schéma JSON doit être un objet');
  }
  return { schema: parsed as Record<string, unknown>, prompt: prompt?.trim() || undefined };
}
