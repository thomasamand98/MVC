import { useApiList } from '../../lib/useApiList.js'

// Forme d'un contrat telle que renvoyée par le Controller backend
// (backend/src/contrat/contrat.controller.ts → GET /contrats), qui reflète
// directement le `contratSelect` de contrat.service.ts. IDCONTRATS est un
// BigInt côté Prisma, converti en string côté service pour rester
// sérialisable en JSON.
export type Contrat = {
  IDCONTRATS: string
  Num_contrat: string | null
  Description_projet: string | null
  Date_debut: string | null
  Date_fin: string | null
  IDSOCIETES: string | null
  Societe: {
    Nom_societe: string | null
    TVA: string | null
  } | null
}

// Récupère la liste des contrats depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
export function useContrats() {
  const { data: contrats, setData: setContrats, loading, error, refetch } = useApiList<Contrat>('contrats')
  return { contrats, setContrats, loading, error, refetch }
}
