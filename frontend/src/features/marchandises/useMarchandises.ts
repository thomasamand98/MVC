import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'une marchandise telle que renvoyée par le Controller backend
// (backend/src/marchandise/marchandise.controller.ts → GET /marchandises),
// qui reflète directement le `marchandiseSelect` de marchandise.service.ts.
// IDMARCHANDISES et CouleurPlanning sont des BigInt côté Prisma, convertis
// en string côté service pour rester sérialisables en JSON. Les champs
// déchet (dangereux/autorisation/inerte/ménager) viennent de la relation
// Dechet et sont des 0/1 (pas des booléens côté vrai modèle Prisma).
export type Marchandise = {
  IDMARCHANDISES: string
  Nom_marchandise: string | null
  CouleurPlanning: string | null
  IDDECHETS: string | null
  Dechet: {
    Description_dechet: string | null
    Code: string | null
    Dangereux: number | null
    Autorisation: number | null
    Inerte: number | null
    Menager: number | null
  } | null
}

// Forme complète d'une marchandise telle que renvoyée par
// GET /marchandises/:id (backend/src/marchandise/marchandise.controller.ts),
// qui reflète directement le `marchandiseDetailSelect` de
// marchandise.service.ts — mêmes champs que `Marchandise` (le déchet lié est
// déjà présent dans le select léger), plus Is_dechet/Archive.
export type MarchandiseDetail = Marchandise & {
  Is_dechet: number | null
  Archive: number | null
}

// Récupère la liste des marchandises depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function useMarchandises(pagination?: ApiListPagination) {
  const { data: marchandises, setData: setMarchandises, loading, error, refetch, total } = useApiList<Marchandise>('marchandises', pagination)
  return { marchandises, setMarchandises, loading, error, refetch, total }
}
