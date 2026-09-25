import { z } from 'zod';
import { num, text } from '../common/validation.js';

// Champs scripturables de l'entité (coordonnées de la société courante,
// paramètres bancaires et SMTP) — mêmes clés que le modèle Entite dans
// schema.prisma, plus les champs d'adresse liée (Adresse1/2/3/CP/Localite/
// Pays/Pays_full_name) aplatis ici pour le formulaire mais persistés dans
// la table `adresses` séparée (voir EntiteService.updateEntite).
export const UpdateEntiteDto = z.object({
  Nom_societe: text.optional(),
  Nom_court: text.optional(),
  Num_Telephone: text.optional(),
  Email_contact: text.optional(),
  Num_TVA: text.optional(),
  Nom_Banque: text.optional(),
  Iban: text.optional(),
  Bic: text.optional(),
  Signataire: text.optional(),
  numero_ucm: text.optional(),
  Num_licence: text.optional(),
  Valeur_facial_cheque_repas: num,
  Seveur_SMTP: text.optional(),
  Port_SMTP: num,
  Utilisateur_SMTP: text.optional(),
  MDP_SMTP: text.optional(),
  TypeConnexion_SMTP: num,
  Utilisateur_smtp_planning: text.optional(),
  MDP_SMTP_Planning: text.optional(),
  Adresse1: text.optional(),
  Adresse2: text.optional(),
  Adresse3: text.optional(),
  CP: text.optional(),
  Localite: text.optional(),
  Pays: text.optional(),
  Pays_full_name: text.optional(),
  // Logo (voir EntiteForm.tsx, glisser-déposer) : data URI base64
  // ("data:image/png;base64,...") envoyée telle quelle par le navigateur
  // (FileReader.readAsDataURL) — convertie en Buffer côté service. Chaîne
  // vide = supprime le logo (contrairement aux champs mot de passe, qui
  // eux restent inchangés si vides).
  Logo: text.optional(),
});
export type UpdateEntiteDto = z.infer<typeof UpdateEntiteDto>;
