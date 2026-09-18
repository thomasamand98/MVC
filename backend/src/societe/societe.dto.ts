// Champs qu'un client peut envoyer pour créer/modifier une société —
// le sous-ensemble scripturable de societeDetailSelect (societe.service.ts).
// IDADRESSES est une string côté JSON (BigInt non sérialisable) — convertie
// dans societe.service.ts. Prospect/Archive sont des codes 0/1 côté vrai
// modèle Prisma (pas des booléens).
export type CreateSocieteDto = {
  Nom_societe?: string;
  Denomination?: string;
  TVA?: string;
  Activite?: string;
  Site_web?: string;
  Note?: string;
  IDADRESSES?: string;
  Prospect?: number;
  Archive?: number;

  // Données de facturation du Client lié, éditées directement depuis la
  // fiche Société (voir SocieteForm.tsx, sous-onglet « Client ») plutôt que
  // via un sélecteur d'enregistrement existant. Si la société n'a pas
  // encore de Client lié et que `Client_Numero_client` est fourni,
  // societe.service.ts en crée un et le lie automatiquement ; sinon le
  // Client déjà lié est mis à jour avec ces champs.
  Client_Numero_client?: string;
  Client_Delai_paiement?: string;
  Client_Taux_tva?: string;
  Client_E_mail_comptabilite?: string;
  Client_Facture_mail?: number;
  Client_Adresse_facturation_societe?: number;
  Client_IDADRESSES_facturation?: string;
  Client_IDCONTACTS_Comptabilite?: string;

  // Idem pour le Fournisseur lié (sous-onglet « Fournisseur »).
  Fournisseur_Numero_fournisseur?: string;
  Fournisseur_Delai_paiement?: string;
  Fournisseur_Taux_tva?: string;
  Fournisseur_E_mail_comptabilite?: string;
  Fournisseur_Facture_mail?: number;
  Fournisseur_Adresse_facturation_societe?: number;
  Fournisseur_IDADRESSES_facturation?: string;
  Fournisseur_IDCONTACTS_Comptabilite?: string;
  Fournisseur_Iban?: string;
  Fournisseur_Bic?: string;
};

export type UpdateSocieteDto = Partial<CreateSocieteDto>;
