import { useApiList } from '../../lib/useApiList.js'

// Forme d'une société telle que renvoyée par le Controller backend
// (backend/src/societe/societe.controller.ts → GET /societes), qui reflète
// directement le `societeSelect` de societe.service.ts. IDSOCIETES est un
// BigInt côté Prisma, converti en string côté service pour rester
// sérialisable en JSON.
export type Societe = {
  IDSOCIETES: string
  Nom_societe: string | null
  Denomination: string | null
  TVA: string | null
  Activite: string | null
  Site_web: string | null
}

// Récupère la liste des sociétés depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
export function useSocietes() {
  const { data: societes, setData: setSocietes, loading, error, refetch } = useApiList<Societe>('societes')
  return { societes, setSocietes, loading, error, refetch }
}
