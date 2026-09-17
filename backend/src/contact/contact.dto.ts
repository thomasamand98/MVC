// Champs qu'un client peut envoyer pour créer/modifier un contact —
// le sous-ensemble scripturable de contactSelect (contact.service.ts).
export type CreateContactDto = {
  Civilite?: string;
  Nom_contact?: string;
  Prenom_contact?: string;
  Telephone_portable?: string;
  Telephone_fixe?: string;
  E_mail?: string;
};

export type UpdateContactDto = Partial<CreateContactDto>;
