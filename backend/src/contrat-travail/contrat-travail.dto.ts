import { z } from 'zod';
import { amount, date, id, num, text } from '../common/validation.js';

// Formes attendues par le ContratTravailController (fiche personnel, onglet
// Contrat). Dates en "AAAA-MM-JJ", taux en nombres (ou strings numériques),
// Routier/Manutention/Atelier en codes 0/1 comme sur Personnel.
export const TauxHoraireDto = z.object({
  // Absent pour un nouveau taux ; présent pour un taux existant à modifier.
  IDTAUX_HORAIRE: id.optional(),
  Date_application: date.optional(),
  Taux_horaire: amount.optional(),
  Taux_horaire_supplementaire: amount.optional(),
  Taux_horaire_nuitee: amount.optional(),
  Taux_nuitee: amount.optional(),
  Taux_samedi: amount.optional(),
  Taux_cheque_repas: amount.optional(),
  Taux_stanby: amount.optional(),
});
export type TauxHoraireDto = z.infer<typeof TauxHoraireDto>;

export const ContratTravailDto = z.object({
  TypeContrat: text.optional(),
  Qualification: text.optional(),
  Date_debut: date.optional(),
  Date_fin: date.optional(),
  Routier: num,
  Manutention: num,
  Atelier: num,
  // Liste complète des taux du contrat : ceux absents de la liste sont
  // supprimés, ceux sans IDTAUX_HORAIRE créés, les autres modifiés.
  Taux: z.array(TauxHoraireDto).optional(),
});
export type ContratTravailDto = z.infer<typeof ContratTravailDto>;
