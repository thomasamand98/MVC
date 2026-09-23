import { useCallback, useEffect, useState } from 'react'
import { apiJson } from '../../lib/api.js'

// Forme d'une catégorie telle que renvoyée par GET /categories-enumeration
// (backend/src/categorie-enumeration/categorie-enumeration.service.ts,
// categorieEnumerationSelect). IDCATEGORIES_ENUMERATION est un BigInt côté
// Prisma, converti en string côté service pour rester sérialisable en JSON.
// Enum_system est un code 0/1 (pas un booléen) : 1 = catégorie utilisée par
// le code applicatif, non supprimable. `_count.Enumerations` est le nombre de
// valeurs rattachées, pour l'afficher sans un appel par catégorie.
export type CategorieEnumeration = {
  IDCATEGORIES_ENUMERATION: string
  Nom: string | null
  Nom_affiche: string | null
  Enum_system: number | null
  _count: { Enumerations: number }
}

// Forme d'une énumération telle que renvoyée par GET /enumerations
// (backend/src/enumeration/enumeration.service.ts, enumerationSelect).
// Valeur_system : code 0/1, 1 = valeur utilisée par le code applicatif.
export type Enumeration = {
  IDENUMERATIONS: string
  IDCATEGORIES_ENUMERATION: string | null
  Valeur_affiche: string | null
  Valeur: string | null
  Ordre: number | null
  Valeur_associee: string | null
  Valeur_system: number | null
}

// Champs scripturables, mêmes clés que CreateCategorieEnumerationDto /
// CreateEnumerationDto côté backend. Valeur_system est un code 0/1 (pas un
// booléen), comme côté Prisma. Enum_system (catégories) n'est pas éditable
// depuis l'écran.
export type CategorieEnumerationDto = {
  Nom: string
  Nom_affiche: string
}

export type EnumerationDto = {
  IDCATEGORIES_ENUMERATION: string
  Valeur_affiche: string
  Valeur: string
  Ordre: number
  Valeur_associee: string
  Valeur_system: number
}

// Même tri que le backend (Ordre puis libellé) — réappliqué localement après
// un create/update pour que la ligne modifiée retrouve sa place sans refaire
// d'appel API.
export function sortEnumerations(list: Enumeration[]): Enumeration[] {
  return [...list].sort(
    (a, b) =>
      (a.Ordre ?? 0) - (b.Ordre ?? 0) ||
      (a.Valeur_affiche ?? '').localeCompare(b.Valeur_affiche ?? '', 'fr') ||
      Number(a.IDENUMERATIONS) - Number(b.IDENUMERATIONS),
  )
}

// Charge `url` (GET) et renvoie le tableau trouvé sous `key` dans la réponse,
// comme useApiList mais avec une clé/URL libres : la clé de la réponse
// (`categories`) ne correspond pas au chemin (`categories-enumeration`), et
// les énumérations dépendent de la catégorie sélectionnée. `url` à null =
// rien à charger (aucune catégorie sélectionnée).
// Le résultat est mémorisé avec l'`url` qui l'a produit : tant qu'il ne
// correspond pas à l'`url` courante, `loading` vaut true et `data` est vide,
// pour ne jamais afficher (même un instant) les valeurs de la catégorie
// précédente après un changement de sélection, ni une réponse arrivée en
// retard.
type Loaded<T> = { url: string; items: T[]; error: string | null }

function useKeyedList<T>(url: string | null, key: string) {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (url === null) return
    let cancelled = false
    apiJson<Record<string, T[]>>(url)
      .then((json) => {
        if (!cancelled) setLoaded({ url, items: json[key], error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setLoaded({ url, items: [], error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [url, key, reloadToken])

  // `setData` permet à la page de mettre à jour la liste en local après un
  // create/update/delete (voir useApiMutation.ts) sans refaire d'appel API.
  const setData = useCallback((update: (items: T[]) => T[]) => {
    setLoaded((prev) => (prev ? { ...prev, items: update(prev.items) } : prev))
  }, [])
  // Relance le chargement : repasse en `loading` le temps de la requête.
  const refetch = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  const current = loaded !== null && loaded.url === url ? loaded : null
  return {
    data: current?.items ?? [],
    setData,
    loading: url !== null && current === null,
    error: current?.error ?? null,
    refetch,
  }
}

// Liste des catégories d'énumération (colonne de gauche de l'écran).
export function useCategoriesEnumeration() {
  const { data, setData, loading, error, refetch } = useKeyedList<CategorieEnumeration>(
    'categories-enumeration',
    'categories',
  )
  return { categories: data, setCategories: setData, loading, error, refetch }
}

// Énumérations liées à la catégorie `categorieId` (null = aucune sélection).
export function useEnumerationsByCategorie(categorieId: string | null) {
  const { data, setData, loading, error, refetch } = useKeyedList<Enumeration>(
    categorieId === null ? null : `enumerations?categorieId=${encodeURIComponent(categorieId)}`,
    'enumerations',
  )
  return { enumerations: data, setEnumerations: setData, loading, error, refetch }
}
