import { z } from 'zod';
import { num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier une condition
// d'exécution — le sous-ensemble scripturable de conditionSelect
// (condition.service.ts).
export const CreateConditionDto = z.object({
  Type_Prestation: num,
  CMR_or_FDR: num,
  Libelle: text.optional(),
});
export type CreateConditionDto = z.infer<typeof CreateConditionDto>;

export const UpdateConditionDto = CreateConditionDto.partial();
export type UpdateConditionDto = z.infer<typeof UpdateConditionDto>;
