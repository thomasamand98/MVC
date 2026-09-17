import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'une condition telle que renvoyée par le Controller backend
// (backend/src/condition/condition.controller.ts → GET /conditions), qui
// reflète directement le `conditionSelect` de condition.service.ts.
// IDCONDITIONS_EXECUTION est un BigInt côté Prisma, converti en string côté
// service pour rester sérialisable en JSON. Type_Prestation/CMR_or_FDR sont
// des codes numériques (pas de texte libre côté vrai modèle Prisma).
export type Condition = {
  IDCONDITIONS_EXECUTION: string
  Type_Prestation: number | null
  CMR_or_FDR: number | null
  Libelle: string | null
}

// Récupère la liste des conditions depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function useConditions(pagination?: ApiListPagination) {
  const { data: conditions, setData: setConditions, loading, error, refetch, total } = useApiList<Condition>('conditions', pagination)
  return { conditions, setConditions, loading, error, refetch, total }
}
