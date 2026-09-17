import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un chauffeur telle que renvoyée par le Controller backend
// (backend/src/chauffeur/chauffeur.controller.ts → GET /chauffeurs), qui
// reflète directement le `chauffeurSelect` de chauffeur.service.ts.
// IDCHAUFFEURS est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON. Archive est un code 0/1 côté vrai
// modèle Prisma (pas un booléen).
export type Chauffeur = {
  IDCHAUFFEURS: string
  Nom_chauffeur: string | null
  Categorie: string | null
  Telephone: string | null
  Archive: number | null
  IDSOCIETES: string | null
  Societe: { Nom_societe: string | null } | null
  IDPERSONNELS: string | null
  Personnel: { Nom_Personnel: string | null; Prenom_Personnel: string | null } | null
}

// Récupère la liste des chauffeurs depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts). Omis
// (ex. pour le sélecteur Chauffeur d'AttelageForm), la liste complète est
// chargée comme avant.
export function useChauffeurs(pagination?: ApiListPagination) {
  const { data: chauffeurs, setData: setChauffeurs, loading, error, refetch, total } = useApiList<Chauffeur>('chauffeurs', pagination)
  return { chauffeurs, setChauffeurs, loading, error, refetch, total }
}
