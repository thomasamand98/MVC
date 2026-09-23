// Champs qu'un client peut envoyer pour créer/modifier une catégorie
// d'énumération. Enum_system est un code 0/1 côté vrai modèle Prisma (pas un
// booléen) : 1 = catégorie utilisée par le code applicatif, non supprimable.
export type CreateCategorieEnumerationDto = {
  Nom?: string;
  Nom_affiche?: string;
  Enum_system?: number;
};

export type UpdateCategorieEnumerationDto = Partial<CreateCategorieEnumerationDto>;
