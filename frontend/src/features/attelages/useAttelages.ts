import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Véhicule lié (tracteur ou remorque), résolu par le backend.
export type AttelageVehicule = { Marque: string | null; Modele: string | null; Num_immat: string | null }

// Forme d'un attelage de référence (table attelages_reference) telle que
// renvoyée par le Controller backend (backend/src/attelage/attelage.controller.ts
// → GET /attelages), qui reflète le `attelageSelect` de attelage.service.ts
// complété des véhicules. Les IDs sont des BigInt côté Prisma, convertis en
// string côté service pour rester sérialisables en JSON.
export type Attelage = {
  IDATTELAGE_REFERENCE: string
  IDCHAUFFEUR: string | null
  Chauffeur: { Nom_chauffeur: string | null } | null
  IDTRACTEUR: string | null
  Tracteur: AttelageVehicule | null
  IDREMORQUE: string | null
  Remorque: AttelageVehicule | null
  IDSOCIETES: string | null
  Societe: { Nom_societe: string | null } | null
}

// Récupère la liste des attelages depuis l'API au montage du composant qui
// l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function useAttelages(pagination?: ApiListPagination) {
  const { data: attelages, setData: setAttelages, loading, error, refetch, total } = useApiList<Attelage>('attelages', pagination)
  return { attelages, setAttelages, loading, error, refetch, total }
}
