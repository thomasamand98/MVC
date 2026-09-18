import { useApiList } from '../../lib/useApiList.js'

// Forme d'un fournisseur telle que renvoyée par le Controller backend
// (backend/src/fournisseur/fournisseur.controller.ts → GET /fournisseurs),
// qui reflète directement le `select` de fournisseur.service.ts.
// IDFOURNISSEURS est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON.
export type Fournisseur = {
  IDFOURNISSEURS: string
  Numero_fournisseur: string | null
}

// Récupère la liste complète des fournisseurs — table de référence courte
// (même rôle que useClients), utilisée par les sélecteurs "Fournisseur"
// (ex. IDFOURNISSEURS de SocieteForm.tsx). Pas de pagination : la liste
// entière alimente le menu déroulant.
export function useFournisseurs() {
  const { data: fournisseurs, setData: setFournisseurs, loading, error, refetch, total } = useApiList<Fournisseur>('fournisseurs')
  return { fournisseurs, setFournisseurs, loading, error, refetch, total }
}
