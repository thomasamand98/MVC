// Champs qu'un client peut envoyer pour créer/modifier une condition
// d'exécution — le sous-ensemble scripturable de conditionSelect
// (condition.service.ts).
export type CreateConditionDto = {
  Type_Prestation?: number;
  CMR_or_FDR?: number;
  Libelle?: string;
};

export type UpdateConditionDto = Partial<CreateConditionDto>;
