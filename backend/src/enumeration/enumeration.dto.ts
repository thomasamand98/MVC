import { z } from 'zod';
import { id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier une énumération.
// IDCATEGORIES_ENUMERATION est une string côté JSON (BigInt non sérialisable)
// — convertie dans enumeration.service.ts. Valeur_system est un code 0/1 côté
// vrai modèle Prisma (pas un booléen) : 1 = valeur utilisée par le code
// applicatif, non supprimable.
export const CreateEnumerationDto = z.object({
  IDCATEGORIES_ENUMERATION: id.optional(),
  Valeur_affiche: text.optional(),
  Valeur: text.optional(),
  Ordre: num,
  Valeur_associee: text.optional(),
  Valeur_system: num,
});
export type CreateEnumerationDto = z.infer<typeof CreateEnumerationDto>;

export const UpdateEnumerationDto = CreateEnumerationDto.partial();
export type UpdateEnumerationDto = z.infer<typeof UpdateEnumerationDto>;
