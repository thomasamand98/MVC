import { useCallback, useEffect, useState } from 'react'

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
export function useApiList<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    return fetch(`http://${window.location.hostname}:3000/${endpoint}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Record<string, T[]>>
      })
      .then((json) => setData(json[endpoint]))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [endpoint])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, setData, loading, error, refetch }
}
