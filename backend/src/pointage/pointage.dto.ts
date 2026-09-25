import { z } from 'zod';
import { id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier un pointage —
// le sous-ensemble scripturable de pointageDetailSelect
// (pointage.service.ts). IDPERSONNELS/IDType_Statut sont des strings côté
// JSON (BigInt non sérialisable), les Date_*/Heure_* des strings — converties
// dans pointage.service.ts. Nuitee est un code 0/1 côté vrai modèle Prisma
// (pas un booléen). Heure_Stanby n'est PAS nullable côté Prisma (pas de "?")
// — un défaut "00:00:00" est appliqué côté service si omis.
export const CreatePointageDto = z.object({
  IDPERSONNELS: id.optional(),
  IDType_Statut: id.optional(),
  Date_application: text.optional(),
  Date_heure_debut: text.optional(),
  Date_heure_fin: text.optional(),
  Heure_coupure: text.optional(),
  Heure_liaison: text.optional(),
  Heure_nuit: text.optional(),
  Heure_Stanby: text.optional(),
  Debut_pause: text.optional(),
  Fin_Pause: text.optional(),
  Heure_jour: text.optional(),
  Nuitee: num,
  Remarque: text.optional(),
});
export type CreatePointageDto = z.infer<typeof CreatePointageDto>;

export const UpdatePointageDto = CreatePointageDto.partial();
export type UpdatePointageDto = z.infer<typeof UpdatePointageDto>;
