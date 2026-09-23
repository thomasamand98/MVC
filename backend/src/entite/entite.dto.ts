// Champs scripturables de l'entité (coordonnées de la société courante,
// paramètres bancaires et SMTP) — mêmes clés que le modèle Entite dans
// schema.prisma, plus les champs d'adresse liée (Adresse1/2/3/CP/Localite/
// Pays/Pays_full_name) aplatis ici pour le formulaire mais persistés dans
// la table `adresses` séparée (voir EntiteService.updateEntite).
export type UpdateEntiteDto = {
  Nom_societe?: string;
  Nom_court?: string;
  Num_Telephone?: string;
  Email_contact?: string;
  Num_TVA?: string;
  Nom_Banque?: string;
  Iban?: string;
  Bic?: string;
  Signataire?: string;
  numero_ucm?: string;
  Num_licence?: string;
  Valeur_facial_cheque_repas?: number;
  Seveur_SMTP?: string;
  Port_SMTP?: number;
  Utilisateur_SMTP?: string;
  MDP_SMTP?: string;
  TypeConnexion_SMTP?: number;
  Utilisateur_smtp_planning?: string;
  MDP_SMTP_Planning?: string;
  Adresse1?: string;
  Adresse2?: string;
  Adresse3?: string;
  CP?: string;
  Localite?: string;
  Pays?: string;
  Pays_full_name?: string;
  // Logo (voir EntiteForm.tsx, glisser-déposer) : data URI base64
  // ("data:image/png;base64,...") envoyée telle quelle par le navigateur
  // (FileReader.readAsDataURL) — convertie en Buffer côté service. Chaîne
  // vide = supprime le logo (contrairement aux champs mot de passe, qui
  // eux restent inchangés si vides).
  Logo?: string;
};
