import { z } from 'zod';
import { id, integerText, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier une marchandise.
// CouleurPlanning et IDDECHETS sont des strings côté JSON (BigInt non
// sérialisable) — converties dans marchandise.service.ts. Is_dechet/Archive
// sont des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export const CreateMarchandiseDto = z.object({
  Nom_marchandise: text.optional(),
  CouleurPlanning: integerText.optional(),
  IDDECHETS: id.optional(),
  Is_dechet: num,
  Archive: num,
});
export type CreateMarchandiseDto = z.infer<typeof CreateMarchandiseDto>;

export const UpdateMarchandiseDto = CreateMarchandiseDto.partial();
export type UpdateMarchandiseDto = z.infer<typeof UpdateMarchandiseDto>;
