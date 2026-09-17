// Champs qu'un client peut envoyer pour créer/modifier un point.
// IDADRESSES et IDSOCIETES sont des strings côté JSON (BigInt non
// sérialisable) — converties dans point.service.ts.
export type CreatePointDto = {
  Libelle?: string;
  Nom_societe?: string;
  Telephone?: string;
  IDADRESSES?: string;
  IDSOCIETES?: string;
};

export type UpdatePointDto = Partial<CreatePointDto>;
