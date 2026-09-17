// Champs qu'un client peut envoyer pour créer/modifier un véhicule —
// le sous-ensemble scripturable de vehiculeDetailSelect (vehicule.service.ts).
// IDSOCIETES est une string côté JSON (BigInt non sérialisable) et les
// Date_* des strings ISO — converties dans vehicule.service.ts.
// Avec_compresseur est un code 0/1 côté vrai modèle Prisma (pas un booléen).
export type CreateVehiculeDto = {
  Type?: number;
  Marque?: string;
  Modele?: string;
  Num_police_assurance?: string;
  Num_immat?: string;
  Num_chassis?: string;
  Date_validite_assurance?: string;
  Num_licence_transport?: string;
  Date_validite_licence?: string;
  Date_modification_licence?: string;
  Date_inspection_auto?: string;
  Date_radiation_immatriculation?: string;
  Date_vente?: string;
  IDSOCIETES?: string;
  Date_premiere_mise_en_circulation?: string;
  Date_validite_tachygeaphe?: string;
  Avec_compresseur?: number;
};

export type UpdateVehiculeDto = Partial<CreateVehiculeDto>;
