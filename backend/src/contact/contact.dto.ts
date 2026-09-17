// Champs qu'un client peut envoyer pour créer/modifier un contact —
// le sous-ensemble scripturable de contactDetailSelect (contact.service.ts).
// IDADRESSES est une string côté JSON (BigInt non sérialisable) — convertie
// dans contact.service.ts. Personne_physique/Adresse_entreprise sont des
// codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type CreateContactDto = {
  Civilite?: string;
  Nom_contact?: string;
  Prenom_contact?: string;
  Telephone_portable?: string;
  Telephone_fixe?: string;
  Telephone_autre?: string;
  E_mail?: string;
  Remarque?: string;
  Personne_physique?: number;
  Adresse_entreprise?: number;
  description_telephone?: string;
  IDADRESSES?: string;
};

export type UpdateContactDto = Partial<CreateContactDto>;
