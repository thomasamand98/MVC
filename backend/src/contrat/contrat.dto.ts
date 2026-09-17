// Champs qu'un client peut envoyer pour créer/modifier un contrat.
// IDSOCIETES/IDMARCHANDISES/IDTYPES_FACTURE sont des strings côté JSON
// (BigInt non sérialisable), Date_debut/Date_fin des strings ISO, et
// Taux_tva une string (Decimal côté vrai modèle Prisma) — converties dans
// contrat.service.ts. Offre_de_prix/Archive/Qt_client_facturation/Suivant
// sont des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type CreateContratDto = {
  Num_contrat?: string;
  Description_projet?: string;
  Date_debut?: string;
  Date_fin?: string;
  IDSOCIETES?: string;
  IDTYPES_FACTURE?: string;
  Annee_archivage?: string;
  Offre_de_prix?: number;
  Note_confidentielle?: string;
  Instruction_CMR?: string;
  Version_contrat?: string;
  Archive?: number;
  Reference_client?: string;
  Taux_tva?: string;
  Qt_client_facturation?: number;
  Suivant?: number;
  IDMARCHANDISES?: string;
  Commissionnaire?: string;
  Type_contrat?: string;
};

export type UpdateContratDto = Partial<CreateContratDto>;
