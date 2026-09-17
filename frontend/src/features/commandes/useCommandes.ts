import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'une commande telle que renvoyée par le Controller backend
// (backend/src/commande/commande.controller.ts → GET /commandes), qui
// reflète directement le `commandeSelect` de commande.service.ts.
// IDCOMMANDES est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON. Le "client" (société du contrat lié) et
// la "marchandise"/"unité" (via la prestation liée) sont résolus en 2 sauts
// — Commande n'a pas de lien direct vers Societe/Marchandise.
export type Commande = {
  IDCOMMANDES: string
  Date_commande: string | null
  IDCONTRATS: string | null
  Contrat: { Num_contrat: string | null; Societe: { Nom_societe: string | null } | null } | null
  IDPRESTATIONS: string | null
  Prestation: { Unite: number | null; Marchandise: { Nom_marchandise: string | null } | null } | null
  QT: number | null
  QT_planifie: number | null
  Statut: string | null
  NumRef: string | null
  Instruction: string | null
}

// Récupère la liste des commandes depuis l'API au montage du composant qui
// l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function useCommandes(pagination?: ApiListPagination) {
  const { data: commandes, setData: setCommandes, loading, error, refetch, total } = useApiList<Commande>('commandes', pagination)
  return { commandes, setCommandes, loading, error, refetch, total }
}
