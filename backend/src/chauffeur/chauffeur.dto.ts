import { z } from 'zod';
import { id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier un chauffeur —
// le sous-ensemble scripturable de chauffeurSelect (chauffeur.service.ts).
// IDPERSONNELS/IDSOCIETES sont des strings côté JSON (BigInt non
// sérialisable) — converties dans chauffeur.service.ts. Archive est un code
// 0/1 côté vrai modèle Prisma (pas un booléen).
export const CreateChauffeurDto = z.object({
  Nom_chauffeur: text.optional(),
  Telephone: text.optional(),
  Categorie: text.optional(),
  Archive: num,
  IDPERSONNELS: id.optional(),
  IDSOCIETES: id.optional(),
});
export type CreateChauffeurDto = z.infer<typeof CreateChauffeurDto>;

export const UpdateChauffeurDto = CreateChauffeurDto.partial();
export type UpdateChauffeurDto = z.infer<typeof UpdateChauffeurDto>;
