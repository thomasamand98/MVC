import { useCallback, useEffect, useState } from 'react'
import { apiJson } from '../../lib/api'
import { toInputValue } from '../planning/dateUtils.js'
import type { Feuille } from './feuille.js'

// Charge la feuille de pointage d'un salarié sur [from, to] (jours inclus)
// via GET /pointage/feuille. Rien n'est chargé tant qu'aucun salarié n'est
// choisi. `reload` relit la feuille après une saisie.
export function useFeuillePointage(personnelId: string | null, from: Date, to: Date) {
  const requestKey = personnelId ? `${personnelId}|${toInputValue(from)}|${toInputValue(to)}` : null
  const [state, setState] = useState<{ key: string | null; feuille: Feuille | null; error: string | null }>({ key: null, feuille: null, error: null })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    if (!personnelId || !requestKey) return
    // Une réponse arrivée après un changement de salarié ou de période est
    // ignorée.
    let cancelled = false
    const query = new URLSearchParams({ personnelId, from: toInputValue(from), to: toInputValue(to) })
    apiJson<Feuille>(`pointage/feuille?${query}`).then(
      (feuille) => { if (!cancelled) setState({ key: requestKey, feuille, error: null }) },
      (err: unknown) => {
        if (!cancelled) setState({ key: requestKey, feuille: null, error: err instanceof Error ? err.message : 'Erreur de chargement du pointage' })
      },
    )
    return () => { cancelled = true }
  }, [personnelId, from, to, requestKey, reloadCount])

  const reload = useCallback(() => setReloadCount((n) => n + 1), [])
  const current = state.key === requestKey

  return {
    feuille: current ? state.feuille : null,
    error: current ? state.error : null,
    loading: requestKey !== null && !current,
    reload,
  }
}
