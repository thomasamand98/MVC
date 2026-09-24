import { apiJson } from '../../lib/api.js'

// Même limite que MAX_OCR_FILE_SIZE côté backend (voir
// backend/src/mistral/mistral.controller.ts) : vérifiée ici aussi pour
// éviter d'envoyer 50 Mo pour rien avant d'obtenir un 413.
export const MAX_OCR_FILE_SIZE = 50 * 1024 * 1024

export function isOcrSupported(file: File): boolean {
  return file.type === 'application/pdf' || file.type.startsWith('image/')
}

// Extraction structurée optionnelle : `schema` est un JSON Schema sous
// forme de chaîne (vide = OCR seul), `prompt` la consigne qui la guide.
export type OcrAnnotationRequest = { schema: string; prompt: string }

// `annotation` = JSON extrait selon le schéma, null sans schéma.
export type OcrResponse = { text: string; annotation: unknown }

// Envoie le fichier en multipart (champ "file", plus "schema"/"prompt" si
// renseignés) à POST /mistral/ocr. Pas de Content-Type explicite : le
// navigateur le fixe lui-même avec le séparateur multipart.
export async function runOcr(file: File, annotation?: OcrAnnotationRequest): Promise<OcrResponse> {
  const body = new FormData()
  body.append('file', file)
  if (annotation?.schema.trim()) {
    body.append('schema', annotation.schema)
    if (annotation.prompt.trim()) body.append('prompt', annotation.prompt)
  }
  return apiJson<OcrResponse>('mistral/ocr', { method: 'POST', body })
}
