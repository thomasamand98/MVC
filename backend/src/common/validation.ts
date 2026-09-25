// Validation des corps de requête (POST/PATCH). Chaque *.dto.ts déclare un
// schéma zod du même nom que son type (ex. `CreateChauffeurDto`), utilisé
// par le contrôleur via `@Body(new ZodBodyPipe(CreateChauffeurDto))`. Les
// services reçoivent ainsi des données au bon type : un corps mal formé est
// refusé en 400 avec un message lisible, au lieu de faire planter le
// service (500). Les champs inconnus sont retirés (comportement par défaut
// de z.object), pour qu'ils n'atteignent jamais Prisma.
import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, type ZodIssue, type ZodTypeAny } from 'zod';

// ---------- Types de champs ----------
// Tolérants en entrée (le front envoie parfois un nombre là où un texte est
// attendu, ou l'inverse), stricts en sortie.

const numberToString = (value: unknown) => (typeof value === 'number' ? String(value) : value);

// Texte libre.
export const text = z.preprocess(numberToString, z.string());

// Identifiant (BigInt côté base) : chiffres uniquement ; '' = aucun.
export const id = z.preprocess(numberToString, z.string().regex(/^\d*$/, 'identifiant invalide'));

// Entier signé stocké en texte (ex. couleur WinDev) ; '' = aucun.
export const integerText = z.preprocess(numberToString, z.string().regex(/^-?\d*$/, 'nombre entier attendu'));

// Nombre, ou code 0/1 (un booléen est converti). '' = champ non envoyé.
export const num = z.preprocess(
  (value) => {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      const parsed = Number(trimmed.replace(',', '.'));
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  },
  z.number().finite().optional(),
);

// Décimal stocké en Decimal Prisma mais transmis en texte (ex. taux de TVA) :
// « 21,5 » devient « 21.5 » ; '' = aucun.
export const decimal = z.preprocess(
  numberToString,
  z
    .string()
    .regex(/^\s*(-?\d+([.,]\d+)?)?\s*$/, 'nombre décimal attendu')
    .transform((value) => value.trim().replace(',', '.')),
);

// Montant saisi (nombre ou texte « 12,50 »), converti par le service.
export const amount = z.union([z.number().finite(), z.string()]);

// Date ou date-heure ISO ; '' = aucune. Une date seule (AAAA-MM-JJ) est
// complétée en minuit UTC, format que Prisma accepte tel quel.
export const date = z.preprocess(
  numberToString,
  z
    .string()
    .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'date invalide')
    .transform((value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value)),
);

// ---------- Pipe ----------

export class ZodBodyPipe<TSchema extends ZodTypeAny> implements PipeTransform<unknown, z.output<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException(result.error.issues.map(describeIssue).join(' '));
  }
}

const expectedLabels: Record<string, string> = {
  string: 'texte attendu',
  number: 'nombre attendu',
  array: 'liste attendue',
  object: 'objet attendu',
  boolean: 'oui/non attendu',
};

function describeIssue(issue: ZodIssue): string {
  if (issue.path.length === 0) return 'Corps de requête invalide.';
  const field = issue.path.map(String).join('.');
  return `« ${field} » : ${reasonOf(issue)}.`;
}

function reasonOf(issue: ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined' ? 'champ obligatoire' : (expectedLabels[issue.expected] ?? 'type invalide');
    case 'invalid_enum_value':
      return `valeur non autorisée (${issue.options.join(', ')})`;
    case 'not_finite':
      return 'nombre attendu';
    default:
      // Messages personnalisés des types ci-dessus (« identifiant invalide »...).
      return issue.message;
  }
}
