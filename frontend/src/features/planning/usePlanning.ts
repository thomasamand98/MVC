import { useCallback, useEffect, useState } from 'react'
import { apiFetch, apiJson } from '../../lib/api'
import { addDays, toInputValue } from './dateUtils.js'
import type { ApiExecution, ApiPlanning, PlanningData, PlanningExecution } from './types.js'

export type MoveChanges = { start: number; end: number; chauffeurId?: string | null; remorqueId?: string | null }
export type CreateFromCommande = {
  commandeId: string
  start: number
  end: number
  chauffeurId: string | null
  tracteurId: string | null
  remorqueId: string | null
}

const toExecution = (e: ApiExecution): PlanningExecution => ({ ...e, start: Date.parse(e.start), end: Date.parse(e.end) })
const parseOptional = (iso: string | null) => (iso ? Date.parse(iso) : null)

function fromApi(api: ApiPlanning): PlanningData {
  return {
    chauffeurs: api.chauffeurs,
    remorques: api.remorques,
    executions: api.executions.map(toExecution),
    commandes: api.commandes.map((c) => ({ ...c, date: parseOptional(c.date) })),
    dechargements: api.dechargements.map((d) => ({ ...d, dateChargement: parseOptional(d.dateChargement) })),
  }
}

async function fetchPlanning(from: Date, to: Date): Promise<PlanningData> {
  const query = new URLSearchParams({
    from: from.toISOString(),
    to: addDays(to, 1).toISOString(),
    jourDebut: toInputValue(from),
    jourFin: toInputValue(to),
  })
  return fromApi(await apiJson<ApiPlanning>(`planning?${query}`))
}

const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const replaceExecution = (data: PlanningData, execution: PlanningExecution): PlanningData => ({
  ...data,
  executions: data.executions.map((e) => (e.id === execution.id ? execution : e)),
})

// Charge le planning de la période [from, to] (jours inclus) et expose les
// actions de l'écran, chacune enregistrée immédiatement en base :
//   - moveExecution : glisser ou redimensionner une carte. Appliqué tout de
//     suite à l'écran, puis annulé si l'enregistrement échoue.
//   - createFromCommande / placeDechargement / removeExecution : appliqués
//     une fois la réponse du serveur reçue (il fournit l'id et les données
//     calculées de l'exécution).
// Chaque action rejette avec l'erreur du serveur, à afficher par l'appelant.
export function usePlanning(from: Date, to: Date) {
  const periodKey = `${from.getTime()}|${to.getTime()}`
  const [state, setState] = useState<{ key: string; data: PlanningData | null; error: string | null }>({ key: '', data: null, error: null })
  const [pending, setPending] = useState(0)
  // Incrémenté par « Réessayer » pour relancer le chargement.
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    // Une réponse arrivée après un changement de période est ignorée.
    let cancelled = false
    fetchPlanning(from, to).then(
      (data) => { if (!cancelled) setState({ key: periodKey, data, error: null }) },
      (err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({ key: periodKey, data: prev.data, error: err instanceof Error ? err.message : 'Erreur de chargement du planning' }))
        }
      },
    )
    return () => { cancelled = true }
  }, [from, to, periodKey, reloadCount])

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, key: '', error: null }))
    setReloadCount((n) => n + 1)
  }, [])

  const setData = useCallback((update: (data: PlanningData) => PlanningData) => {
    setState((prev) => (prev.data ? { ...prev, data: update(prev.data) } : prev))
  }, [])

  async function track<T>(action: () => Promise<T>): Promise<T> {
    setPending((n) => n + 1)
    try {
      return await action()
    } finally {
      setPending((n) => n - 1)
    }
  }

  async function moveExecution(execution: PlanningExecution, changes: MoveChanges) {
    setData((data) => replaceExecution(data, { ...execution, ...changes }))
    try {
      const saved = await track(() =>
        apiJson<ApiExecution>(`planning/executions/${execution.id}`, jsonBody('PATCH', {
          ...changes,
          start: new Date(changes.start).toISOString(),
          end: new Date(changes.end).toISOString(),
        })),
      )
      setData((data) => replaceExecution(data, toExecution(saved)))
    } catch (err) {
      setData((data) => replaceExecution(data, execution))
      throw err
    }
  }

  async function createFromCommande(input: CreateFromCommande): Promise<string> {
    const saved = toExecution(
      await track(() =>
        apiJson<ApiExecution>('planning/executions', jsonBody('POST', {
          ...input,
          start: new Date(input.start).toISOString(),
          end: new Date(input.end).toISOString(),
        })),
      ),
    )
    setData((data) => ({
      ...data,
      executions: [...data.executions, saved],
      commandes: data.commandes.map((c) => (c.id === input.commandeId ? { ...c, qtPlanifie: c.qtPlanifie + 1 } : c)),
    }))
    return saved.id
  }

  // Un déchargement en attente est déjà une exécution (sans date) : le
  // placer revient à lui donner des dates et une ressource.
  async function placeDechargement(id: string, changes: MoveChanges) {
    const saved = toExecution(
      await track(() =>
        apiJson<ApiExecution>(`planning/executions/${id}`, jsonBody('PATCH', {
          ...changes,
          start: new Date(changes.start).toISOString(),
          end: new Date(changes.end).toISOString(),
        })),
      ),
    )
    setData((data) => ({
      ...data,
      executions: [...data.executions, saved],
      dechargements: data.dechargements.filter((d) => d.id !== id),
    }))
  }

  async function removeExecution(id: string) {
    await track(() => apiFetch(`planning/executions/${id}`, { method: 'DELETE' }))
    setData((data) => {
      const removed = data.executions.find((e) => e.id === id)
      return {
        ...data,
        executions: data.executions.filter((e) => e.id !== id),
        dechargements: data.dechargements.filter((d) => d.id !== id),
        commandes: data.commandes.map((c) => (c.id === removed?.commandeId ? { ...c, qtPlanifie: Math.max(0, c.qtPlanifie - 1) } : c)),
      }
    })
  }

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== periodKey,
    saving: pending > 0,
    reload,
    moveExecution,
    createFromCommande,
    placeDechargement,
    removeExecution,
  }
}
