// Champs qu'un client peut envoyer pour créer/modifier un chauffeur —
// le sous-ensemble scripturable de chauffeurSelect (chauffeur.service.ts).
// IDPERSONNELS/IDSOCIETES sont des strings côté JSON (BigInt non
// sérialisable) — converties dans chauffeur.service.ts. Archive est un code
// 0/1 côté vrai modèle Prisma (pas un booléen).
export type CreateChauffeurDto = {
  Nom_chauffeur?: string;
  Telephone?: string;
  Categorie?: string;
  Archive?: number;
  IDPERSONNELS?: string;
  IDSOCIETES?: string;
};

export type UpdateChauffeurDto = Partial<CreateChauffeurDto>;
