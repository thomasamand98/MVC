// Champs qu'un client peut envoyer pour créer/modifier un pointage —
// le sous-ensemble scripturable de pointageDetailSelect
// (pointage.service.ts). IDPERSONNELS/IDType_Statut sont des strings côté
// JSON (BigInt non sérialisable), les Date_*/Heure_* des strings — converties
// dans pointage.service.ts. Nuitee est un code 0/1 côté vrai modèle Prisma
// (pas un booléen). Heure_Stanby n'est PAS nullable côté Prisma (pas de "?")
// — un défaut "00:00:00" est appliqué côté service si omis.
export type CreatePointageDto = {
  IDPERSONNELS?: string;
  IDType_Statut?: string;
  Date_application?: string;
  Date_heure_debut?: string;
  Date_heure_fin?: string;
  Heure_coupure?: string;
  Heure_liaison?: string;
  Heure_nuit?: string;
  Heure_Stanby?: string;
  Debut_pause?: string;
  Fin_Pause?: string;
  Heure_jour?: string;
  Nuitee?: number;
  Remarque?: string;
};

export type UpdatePointageDto = Partial<CreatePointageDto>;
