// Champs qu'un client peut envoyer pour créer/modifier une marchandise.
// CouleurPlanning et IDDECHETS sont des strings côté JSON (BigInt non
// sérialisable) — converties dans marchandise.service.ts. Is_dechet/Archive
// sont des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type CreateMarchandiseDto = {
  Nom_marchandise?: string;
  CouleurPlanning?: string;
  IDDECHETS?: string;
  Is_dechet?: number;
  Archive?: number;
};

export type UpdateMarchandiseDto = Partial<CreateMarchandiseDto>;
