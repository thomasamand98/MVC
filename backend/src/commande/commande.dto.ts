// Champs qu'un client peut envoyer pour créer/modifier une commande —
// le sous-ensemble scripturable de commandeSelect (commande.service.ts).
// IDCONTRATS/IDPRESTATIONS sont des strings côté JSON (BigInt non
// sérialisable) et Date_commande une string ISO — converties dans
// commande.service.ts.
export type CreateCommandeDto = {
  Date_commande?: string;
  IDCONTRATS?: string;
  IDPRESTATIONS?: string;
  QT?: number;
  QT_planifie?: number;
  Statut?: string;
  NumRef?: string;
  Instruction?: string;
};

export type UpdateCommandeDto = Partial<CreateCommandeDto>;
