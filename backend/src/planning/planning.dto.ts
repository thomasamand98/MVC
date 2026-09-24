// Corps des requêtes de l'écran Planning (frontend/src/features/planning/).
// Les ids sont des strings côté JSON (BigInt non sérialisable), les dates
// des strings ISO — convertis et vérifiés dans planning.service.ts.

// Déplacement / redimensionnement d'une exécution par glisser-déposer. Les
// champs chauffeurId / remorqueId ne sont envoyés que si la carte a changé
// de ligne (null = « Non affecté ») ; absents, l'affectation est conservée.
export type MovePlanningExecutionDto = {
  start: string;
  end: string;
  chauffeurId?: string | null;
  remorqueId?: string | null;
};

// Création d'une exécution en déposant une commande sur le planning.
export type CreatePlanningExecutionDto = {
  commandeId: string;
  start: string;
  end: string;
  chauffeurId: string | null;
  tracteurId: string | null;
  remorqueId: string | null;
};
