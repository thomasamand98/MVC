// Champs qu'un client peut envoyer pour créer/modifier une condition CMR d'un
// contrat. IDCONTRATS est une string côté JSON (BigInt non sérialisable) —
// convertie dans condition-cmr.service.ts. Boite_a_cocher est un code 0/1
// côté vrai modèle Prisma (pas un booléen).
export type CreateConditionCmrDto = {
  IDCONTRATS?: string;
  Libelle?: string;
  Boite_a_cocher?: number;
};

// IDCONTRATS n'est pas modifiable : une condition reste attachée au contrat
// pour lequel elle a été créée.
export type UpdateConditionCmrDto = Omit<CreateConditionCmrDto, 'IDCONTRATS'>;
