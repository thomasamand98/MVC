// Champs qu'un client peut envoyer pour créer/modifier une société —
// le sous-ensemble scripturable de societeDetailSelect (societe.service.ts).
// IDADRESSES/IDCLIENTS/IDFOURNISSEURS sont des strings côté JSON (BigInt non
// sérialisable) — converties dans societe.service.ts. Prospect/Archive sont
// des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type CreateSocieteDto = {
  Nom_societe?: string;
  Denomination?: string;
  TVA?: string;
  Activite?: string;
  Site_web?: string;
  Note?: string;
  IDADRESSES?: string;
  IDCLIENTS?: string;
  IDFOURNISSEURS?: string;
  Prospect?: number;
  Archive?: number;
};

export type UpdateSocieteDto = Partial<CreateSocieteDto>;
