import { z } from 'zod';
import { num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier une catégorie
// d'énumération. Enum_system est un code 0/1 côté vrai modèle Prisma (pas un
// booléen) : 1 = catégorie utilisée par le code applicatif, non supprimable.
export const CreateCategorieEnumerationDto = z.object({
  Nom: text.optional(),
  Nom_affiche: text.optional(),
  Enum_system: num,
});
export type CreateCategorieEnumerationDto = z.infer<typeof CreateCategorieEnumerationDto>;

export const UpdateCategorieEnumerationDto = CreateCategorieEnumerationDto.partial();
export type UpdateCategorieEnumerationDto = z.infer<typeof UpdateCategorieEnumerationDto>;
