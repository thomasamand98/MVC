import { z } from 'zod';
import { id } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier un attelage de
// référence (table attelages_reference) — le sous-ensemble scripturable de
// attelageSelect (attelage.service.ts). Les IDs sont des strings côté JSON
// (BigInt non sérialisable), '' = aucun lien — convertis dans
// attelage.service.ts.
export const CreateAttelageDto = z.object({
  IDCHAUFFEUR: id.optional(),
  IDTRACTEUR: id.optional(),
  IDREMORQUE: id.optional(),
  IDSOCIETES: id.optional(),
});
export type CreateAttelageDto = z.infer<typeof CreateAttelageDto>;

export const UpdateAttelageDto = CreateAttelageDto.partial();
export type UpdateAttelageDto = z.infer<typeof UpdateAttelageDto>;
