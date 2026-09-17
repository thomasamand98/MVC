// Champs qu'un client peut envoyer pour créer/modifier une marchandise.
// CouleurPlanning et IDDECHETS sont des strings côté JSON (BigInt non
// sérialisable) — converties dans marchandise.service.ts.
export type CreateMarchandiseDto = {
  Nom_marchandise?: string;
  CouleurPlanning?: string;
  IDDECHETS?: string;
};

export type UpdateMarchandiseDto = Partial<CreateMarchandiseDto>;
