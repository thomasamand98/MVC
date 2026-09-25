import { z } from 'zod';
import { date, id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier un véhicule —
// le sous-ensemble scripturable de vehiculeDetailSelect (vehicule.service.ts).
// IDSOCIETES est une string côté JSON (BigInt non sérialisable) et les
// Date_* des strings ISO — converties dans vehicule.service.ts.
// Avec_compresseur est un code 0/1 côté vrai modèle Prisma (pas un booléen).
export const CreateVehiculeDto = z.object({
  Type: num,
  Marque: text.optional(),
  Modele: text.optional(),
  Num_police_assurance: text.optional(),
  Num_immat: text.optional(),
  Num_chassis: text.optional(),
  Date_validite_assurance: date.optional(),
  Num_licence_transport: text.optional(),
  Date_validite_licence: date.optional(),
  Date_modification_licence: date.optional(),
  Date_inspection_auto: date.optional(),
  Date_radiation_immatriculation: date.optional(),
  Date_vente: date.optional(),
  IDSOCIETES: id.optional(),
  Date_premiere_mise_en_circulation: date.optional(),
  Date_validite_tachygeaphe: date.optional(),
  Avec_compresseur: num,
});
export type CreateVehiculeDto = z.infer<typeof CreateVehiculeDto>;

export const UpdateVehiculeDto = CreateVehiculeDto.partial();
export type UpdateVehiculeDto = z.infer<typeof UpdateVehiculeDto>;
