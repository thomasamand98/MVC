// Champs qu'un client peut envoyer pour créer/modifier une société —
// le sous-ensemble scripturable de societeSelect (societe.service.ts).
export type CreateSocieteDto = {
  Nom_societe?: string;
  Denomination?: string;
  TVA?: string;
  Activite?: string;
  Site_web?: string;
};

export type UpdateSocieteDto = Partial<CreateSocieteDto>;
