// Champs qu'un client peut envoyer pour créer/modifier un point.
// IDADRESSES/IDSOCIETES/IDCONTACTS_DEFAUTS sont des strings côté JSON
// (BigInt non sérialisable) — converties dans point.service.ts. Archive est
// un code 0/1 côté vrai modèle Prisma (pas un booléen).
export type CreatePointDto = {
  Libelle?: string;
  Nom_societe?: string;
  Telephone?: string;
  IDADRESSES?: string;
  IDSOCIETES?: string;
  Archive?: number;
  Lien_googleMap?: string;
  Instruction?: string;
  IDCONTACTS_DEFAUTS?: string;
};

export type UpdatePointDto = Partial<CreatePointDto>;
