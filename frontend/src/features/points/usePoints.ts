import { useApiList } from '../../lib/useApiList.js'

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

// Récupère la liste des points depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
export function usePoints() {
  const { data: points, setData: setPoints, loading, error, refetch } = useApiList<Point>('points')
  return { points, setPoints, loading, error, refetch }
}
