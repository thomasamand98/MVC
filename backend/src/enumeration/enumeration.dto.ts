// Champs qu'un client peut envoyer pour créer/modifier une énumération.
// IDCATEGORIES_ENUMERATION est une string côté JSON (BigInt non sérialisable)
// — convertie dans enumeration.service.ts. Valeur_system est un code 0/1 côté
// vrai modèle Prisma (pas un booléen) : 1 = valeur utilisée par le code
// applicatif, non supprimable.
export type CreateEnumerationDto = {
  IDCATEGORIES_ENUMERATION?: string;
  Valeur_affiche?: string;
  Valeur?: string;
  Ordre?: number;
  Valeur_associee?: string;
  Valeur_system?: number;
};

export type UpdateEnumerationDto = Partial<CreateEnumerationDto>;
