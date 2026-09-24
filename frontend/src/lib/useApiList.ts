import { useCallback, useEffect, useRef, useState } from 'react'
import { apiJson } from './api'

// `search` : texte du champ « Rechercher » (voir CrudPage.tsx), envoyé en
// ?search=... et appliqué côté serveur sur toutes les colonnes texte
// (voir backend/src/common/search.ts) — donc sur toute la table, pas
// seulement sur la page affichée.
// `filters` : paramètres supplémentaires envoyés tels quels en query string
// (ex. { societeId } pour les onglets de la fiche Société).
export type ApiListPagination = { page: number; pageSize: number; search?: string; filters?: Record<string, string> }

// Récupère une liste depuis l'API backend au montage du composant qui
// l'utilise. `endpoint` est à la fois le chemin HTTP (ex. "societes" →
// GET /societes) et la clé sous laquelle le backend renvoie le tableau
// (ex. { societes: [...] }) — ce qui est le cas pour toutes les features
// sous src/features/ (voir *.controller.ts côté backend).
// Factorisé ici car useSocietes/useContrats/... suivaient tous exactement
// cette même logique, seuls le type et l'endpoint changeant.
// `refetch` permet de recharger la liste depuis l'API si besoin ; `setData`
// permet aux pages de mettre à jour la liste en local après un
// create/update/delete (voir useApiMutation.ts) sans refaire d'appel API.
// `pagination` est optionnel — omis, le comportement est inchangé (toute la
// liste en un appel, `total` vaut simplement le nombre d'éléments reçus).
// Fourni (voir useCommandes.ts), `page`/`pageSize` sont envoyés en query
// string et `refetch` est automatiquement redéclenché à chaque changement.
export function useApiList<T>(endpoint: string, pagination?: ApiListPagination) {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Numéro de la dernière requête lancée : une réponse plus ancienne (ex.
  // recherche « dup » arrivée après « dupont ») est ignorée au lieu
  // d'écraser la plus récente.
  const lastRequest = useRef(0)

  // Sérialisé pour servir de dépendance stable : un objet `filters` recréé à
  // chaque rendu ne doit pas relancer la requête.
  const filtersKey = JSON.stringify(pagination?.filters ?? {})

  const refetch = useCallback(() => {
    const requestId = ++lastRequest.current
    setLoading(true)
    setError(null)
    let query = ''
    if (pagination) {
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        ...(JSON.parse(filtersKey) as Record<string, string>),
      })
      const search = pagination.search?.trim()
      if (search) params.set('search', search)
      query = `?${params.toString()}`
    }
    return apiJson<Record<string, T[]> & { total?: number }>(`${endpoint}${query}`)
      .then((json) => {
        if (requestId !== lastRequest.current) return
        setData(json[endpoint])
        setTotal(json.total ?? json[endpoint].length)
      })
      .catch((err: Error) => {
        if (requestId === lastRequest.current) setError(err.message)
      })
      .finally(() => {
        if (requestId === lastRequest.current) setLoading(false)
      })
  }, [endpoint, pagination?.page, pagination?.pageSize, pagination?.search, filtersKey])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, setData, loading, error, refetch, total }
}
