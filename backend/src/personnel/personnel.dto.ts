// Champs qu'un client peut envoyer pour créer/modifier un personnel —
// le sous-ensemble scripturable de personnelDetailSelect
// (personnel.service.ts). IDADRESSES est une string côté JSON (BigInt non
// sérialisable) et les Date_* des strings ISO — converties dans
// personnel.service.ts. Routier/Manutention/Atelier sont des codes 0/1 côté
// vrai modèle Prisma (pas des booléens).
export type CreatePersonnelDto = {
  Civilite_Personnel?: string;
  Nom_Personnel?: string;
  Prenom_Personnel?: string;
  Telephone_portable?: string;
  Telephone_fixe?: string;
  Telephone_autre?: string;
  Telephone_professionnel?: string;
  Description_telephone?: string;
  E_mail?: string;
  E_mail_professionnel?: string;
  Num_service_social?: string;
  Num_registre_national?: string;
  Date_naissance?: string;
  Lieu_naissance?: string;
  Pays_Naissance?: string;
  Etat_civil?: string;
  Nbr_personne_charge?: number;
  Iban?: string;
  Bic?: string;
  Nom_Banque?: string;
  Qualification?: string;
  Routier?: number;
  Manutention?: number;
  Atelier?: number;
  Commentaire_Personnel?: string;
  IDADRESSES?: string;
  Date_validite_selection_medicale?: string;
  Date_validite_carte_chauffeur?: string;
  Date_validite_CAP?: string;
  Date_validite_carte_identite?: string;
  Date_validite_A1?: string;
  Date_validite_SIPSI?: string;
};

export type UpdatePersonnelDto = Partial<CreatePersonnelDto>;
