// Champs qu'un client peut envoyer pour créer/modifier un contrat.
// IDSOCIETES est une string côté JSON (BigInt non sérialisable) et
// Date_debut/Date_fin des strings ISO — converties dans contrat.service.ts.
export type CreateContratDto = {
  Num_contrat?: string;
  Description_projet?: string;
  Date_debut?: string;
  Date_fin?: string;
  IDSOCIETES?: string;
};

export type UpdateContratDto = Partial<CreateContratDto>;
