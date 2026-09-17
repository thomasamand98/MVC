import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un attelage telle que renvoyée par le Controller backend
// (backend/src/attelage/attelage.controller.ts → GET /attelages), qui
// reflète directement le `attelageSelect` de attelage.service.ts.
// IDATTELAGE est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON.
export type Attelage = {
  IDATTELAGE: string
  IDCHAUFFEUR: string | null
  Chauffeur: { Nom_chauffeur: string | null } | null
  IDTRACTEUR: string | null
  Tracteur: { Marque: string | null; Modele: string | null; Num_immat: string | null } | null
  IDREMORQUE: string | null
  Remorque: { Marque: string | null; Modele: string | null; Num_immat: string | null } | null
  IDPERSONNELS: string | null
  Personnel: { Nom_Personnel: string | null; Prenom_Personnel: string | null } | null
  Date_debut: string | null
  Date_fin: string | null
}

// Récupère la liste des attelages depuis l'API au montage du composant qui
// l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function useAttelages(pagination?: ApiListPagination) {
  const { data: attelages, setData: setAttelages, loading, error, refetch, total } = useApiList<Attelage>('attelages', pagination)
  return { attelages, setAttelages, loading, error, refetch, total }
}
