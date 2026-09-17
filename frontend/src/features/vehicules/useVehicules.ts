import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un véhicule telle que renvoyée par le Controller backend
// (backend/src/vehicule/vehicule.controller.ts → GET /vehicules), qui
// reflète directement le `vehiculeSelect` de vehicule.service.ts.
// IDVEHICULES est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON.
export type Vehicule = {
  IDVEHICULES: string
  Num_immat: string | null
  Type: number | null
  Marque: string | null
  Modele: string | null
  IDSOCIETES: string | null
  Societe: { Nom_societe: string | null } | null
  Num_police_assurance: string | null
  Num_chassis: string | null
  Date_validite_assurance: string | null
  Num_licence_transport: string | null
  Date_validite_licence: string | null
  Date_inspection_auto: string | null
  Date_validite_tachygeaphe: string | null
}

// Forme complète d'un véhicule telle que renvoyée par GET /vehicules/:id,
// qui reflète directement le `vehiculeDetailSelect` de vehicule.service.ts.
// Avec_compresseur est un code 0/1 côté vrai modèle Prisma (pas un booléen).
export type VehiculeDetail = Vehicule & {
  Date_modification_licence: string | null
  Date_radiation_immatriculation: string | null
  Date_vente: string | null
  Date_premiere_mise_en_circulation: string | null
  Avec_compresseur: number
}

// Récupère la liste des véhicules depuis l'API au montage du composant qui
// l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts). Omis
// (ex. pour les sélecteurs Tracteur/Remorque d'AttelageForm), la liste
// complète est chargée comme avant.
export function useVehicules(pagination?: ApiListPagination) {
  const { data: vehicules, setData: setVehicules, loading, error, refetch, total } = useApiList<Vehicule>('vehicules', pagination)
  return { vehicules, setVehicules, loading, error, refetch, total }
}
