import { z } from 'zod';
import { date, id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier une commande —
// le sous-ensemble scripturable de commandeSelect (commande.service.ts).
// IDCONTRATS/IDPRESTATIONS sont des strings côté JSON (BigInt non
// sérialisable) et Date_commande une string ISO — converties dans
// commande.service.ts.
export const CreateCommandeDto = z.object({
  Date_commande: date.optional(),
  IDCONTRATS: id.optional(),
  IDPRESTATIONS: id.optional(),
  QT: num,
  QT_planifie: num,
  Statut: text.optional(),
  NumRef: text.optional(),
  Instruction: text.optional(),
});
export type CreateCommandeDto = z.infer<typeof CreateCommandeDto>;

export const UpdateCommandeDto = CreateCommandeDto.partial();
export type UpdateCommandeDto = z.infer<typeof UpdateCommandeDto>;
