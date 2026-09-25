import { z } from 'zod';
import { decimal, date, id, num, text } from '../common/validation.js';

// Champs qu'un client peut envoyer pour créer/modifier un contrat.
// IDSOCIETES/IDMARCHANDISES/IDTYPES_FACTURE sont des strings côté JSON
// (BigInt non sérialisable), Date_debut/Date_fin des strings ISO, et
// Taux_tva une string (Decimal côté vrai modèle Prisma) — converties dans
// contrat.service.ts. Offre_de_prix/Archive/Qt_client_facturation/Suivant
// sont des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export const CreateContratDto = z.object({
  Num_contrat: text.optional(),
  Description_projet: text.optional(),
  Date_debut: date.optional(),
  Date_fin: date.optional(),
  IDSOCIETES: id.optional(),
  IDTYPES_FACTURE: id.optional(),
  Annee_archivage: text.optional(),
  Offre_de_prix: num,
  Note_confidentielle: text.optional(),
  Instruction_CMR: text.optional(),
  Version_contrat: text.optional(),
  Archive: num,
  Reference_client: text.optional(),
  Taux_tva: decimal.optional(),
  Qt_client_facturation: num,
  Suivant: num,
  IDMARCHANDISES: id.optional(),
  Commissionnaire: text.optional(),
  Type_contrat: text.optional(),
});
export type CreateContratDto = z.infer<typeof CreateContratDto>;

export const UpdateContratDto = CreateContratDto.partial();
export type UpdateContratDto = z.infer<typeof UpdateContratDto>;
