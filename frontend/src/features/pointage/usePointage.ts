import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un pointage telle que renvoyée par le Controller backend
// (backend/src/pointage/pointage.controller.ts → GET /pointage), qui
// reflète directement le `pointageSelect` de pointage.service.ts.
// IDPOINTAGES est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON. Nuitee est un code 0/1 côté vrai modèle
// Prisma (pas un booléen).
export type Pointage = {
  IDPOINTAGES: string
  Date_application: string | null
  IDPERSONNELS: string | null
  Personnel: { Nom_Personnel: string | null; Prenom_Personnel: string | null } | null
  Date_heure_debut: string | null
  Date_heure_fin: string | null
  Heure_coupure: string | null
  Heure_nuit: string | null
  Heure_liaison: string | null
  Heure_Stanby: string
  IDType_Statut: string | null
  TypeStatut: { Libelle_generique: string | null } | null
  Nuitee: number | null
  Remarque: string | null
}

// Forme complète d'un pointage telle que renvoyée par GET /pointage/:id, qui
// reflète directement le `pointageDetailSelect` de pointage.service.ts.
export type PointageDetail = Pointage & {
  Debut_pause: string | null
  Fin_Pause: string | null
  Heure_jour: string | null
}

// Récupère la liste des pointages depuis l'API au montage du composant qui
// l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function usePointage(pagination?: ApiListPagination) {
  const { data: pointage, setData: setPointage, loading, error, refetch, total } = useApiList<Pointage>('pointage', pagination)
  return { pointage, setPointage, loading, error, refetch, total }
}
