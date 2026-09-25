import { z } from 'zod';
import { id, text } from '../common/validation.js';

// Corps des requêtes de l'écran Planning (frontend/src/features/planning/).
// Les ids sont des strings côté JSON (BigInt non sérialisable), les dates
// des strings ISO — convertis et vérifiés dans planning.service.ts.

// Déplacement / redimensionnement d'une exécution par glisser-déposer. Les
// champs chauffeurId / remorqueId ne sont envoyés que si la carte a changé
// de ligne (null = « Non affecté ») ; absents, l'affectation est conservée.
export const MovePlanningExecutionDto = z.object({
  start: text,
  end: text,
  chauffeurId: id.nullable().optional(),
  remorqueId: id.nullable().optional(),
});
export type MovePlanningExecutionDto = z.infer<typeof MovePlanningExecutionDto>;

// Création d'une exécution en déposant une commande sur le planning.
export const CreatePlanningExecutionDto = z.object({
  commandeId: id,
  start: text,
  end: text,
  chauffeurId: id.nullable(),
  tracteurId: id.nullable(),
  remorqueId: id.nullable(),
});
export type CreatePlanningExecutionDto = z.infer<typeof CreatePlanningExecutionDto>;
