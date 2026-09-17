// Champs qu'un client peut envoyer pour créer/modifier un attelage —
// le sous-ensemble scripturable de attelageSelect (attelage.service.ts).
// IDCHAUFFEUR/IDTRACTEUR/IDREMORQUE/IDPERSONNELS sont des strings côté JSON
// (BigInt non sérialisable) et Date_debut/Date_fin des strings ISO —
// converties dans attelage.service.ts.
export type CreateAttelageDto = {
  IDCHAUFFEUR?: string;
  IDTRACTEUR?: string;
  IDREMORQUE?: string;
  IDPERSONNELS?: string;
  Date_debut?: string;
  Date_fin?: string;
};

export type UpdateAttelageDto = Partial<CreateAttelageDto>;
