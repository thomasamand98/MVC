import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un point telle que renvoyée par le Controller backend
// (backend/src/point/point.controller.ts → GET /points), qui reflète
// directement le `pointSelect` de point.service.ts. IDPOINTS est un BigInt
// côté Prisma, converti en string côté service pour rester sérialisable en
// JSON.
export type Point = {
  IDPOINTS: string
  Libelle: string | null
  Nom_societe: string | null
  Telephone: string | null
  IDADRESSES: string | null
  IDSOCIETES: string | null
  Adresse: {
    Adresse1: string | null
    CP: string | null
    Localite: string | null
  } | null
}

// Forme complète d'un point telle que renvoyée par GET /points/:id
// (backend/src/point/point.controller.ts), qui reflète directement le
// `pointDetailSelect` de point.service.ts — tous les champs, plus le
// contact par défaut résolu et la totalité des contacts rattachés.
export type PointDetail = {
  IDPOINTS: string
  Libelle: string | null
  Nom_societe: string | null
  Telephone: string | null
  IDADRESSES: string | null
  IDSOCIETES: string | null
  Adresse: {
    Adresse1: string | null
    Adresse2: string | null
    Adresse3: string | null
    CP: string | null
    Localite: string | null
    Pays: string | null
    Pays_full_name: string | null
  } | null
  Archive: number | null
  Lien_googleMap: string | null
  Instruction: string | null
  IDCONTACTS_DEFAUTS: string | null
  ContactDefauts: { Nom_contact: string | null; Prenom_contact: string | null } | null
  PointContacts: {
    IDCONTACTS: string | null
    Lien: string | null
    Recevoir_Mail_Planning: number | null
    Contact: {
      Civilite: string | null
      Nom_contact: string | null
      Prenom_contact: string | null
      Telephone_portable: string | null
      Telephone_fixe: string | null
      E_mail: string | null
    } | null
  }[]
  // Plages d'ouverture (table grilles_horaires) : Jour_semaine 1 = lundi …
  // 7 = dimanche, heures en « HH:MM ».
  Horaires: { Jour_semaine: number; Heure_debut: string; Heure_fin: string }[]
}

// Récupère la liste des points depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function usePoints(pagination?: ApiListPagination) {
  const { data: points, setData: setPoints, loading, error, refetch, total } = useApiList<Point>('points', pagination)
  return { points, setPoints, loading, error, refetch, total }
}
