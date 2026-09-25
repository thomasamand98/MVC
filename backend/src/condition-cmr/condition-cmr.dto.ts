import { z } from 'zod';
import { id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier une condition CMR d'un
// contrat. IDCONTRATS est une string côté JSON (BigInt non sérialisable) —
// convertie dans condition-cmr.service.ts. Boite_a_cocher est un code 0/1
// côté vrai modèle Prisma (pas un booléen).
export const CreateConditionCmrDto = z.object({
  IDCONTRATS: id.optional(),
  Libelle: text.optional(),
  Boite_a_cocher: num,
});
export type CreateConditionCmrDto = z.infer<typeof CreateConditionCmrDto>;

// IDCONTRATS n'est pas modifiable : une condition reste attachée au contrat
// pour lequel elle a été créée.
export const UpdateConditionCmrDto = CreateConditionCmrDto.omit({ IDCONTRATS: true });
export type UpdateConditionCmrDto = z.infer<typeof UpdateConditionCmrDto>;
