import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { GuardScope, type LeaveGuard, type LeaveTarget } from './scope.js'

// Zone courante (voir scope.ts) — fournie par UnsavedChangesProvider à la
// racine, puis par chaque GuardBoundary (onglet, fiche, modale...).
export const GuardScopeContext = createContext<GuardScope>(new GuardScope(null))

// Demande quoi faire des modifications de `target` avant de la quitter :
// true = on peut quitter (rien de modifié, enregistré, ou abandonné).
export type ConfirmLeave = (target: LeaveTarget) => Promise<boolean>

export const ConfirmLeaveContext = createContext<ConfirmLeave>(async () => true)

// Crée une zone enfant de la zone courante, à fournir à <GuardBoundary>.
export function useGuardScope(): GuardScope {
  const parent = useContext(GuardScopeContext)
  const [scope] = useState(() => new GuardScope(parent))
  useEffect(() => {
    scope.attach()
    return () => scope.detach()
  }, [scope])
  return scope
}

// À appeler avant de quitter : `confirmLeave()` vérifie la zone courante,
// `confirmLeave(scope)` une zone précise.
export function useConfirmLeave(): (target?: LeaveTarget) => Promise<boolean> {
  const current = useContext(GuardScopeContext)
  const confirm = useContext(ConfirmLeaveContext)
  return useCallback((target?: LeaveTarget) => confirm(target ?? current), [confirm, current])
}

type LeaveGuardOptions = {
  isDirty: () => boolean
  save: () => Promise<unknown> | void
  validate?: () => boolean
}

// Déclare une saisie dans la zone courante. Renvoie `confirmLeave(leave)` :
// pour les boutons Annuler/Fermer de la saisie elle-même, qui ne
// concernent qu'elle.
export function useLeaveGuard(options: LeaveGuardOptions): (leave: () => void) => Promise<void> {
  const scope = useContext(GuardScopeContext)
  const confirm = useContext(ConfirmLeaveContext)
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })
  const released = useRef(false)
  const [guard] = useState<LeaveGuard>(() => ({
    isDirty: () => !released.current && latest.current.isDirty(),
    save: () => latest.current.save(),
    validate: () => latest.current.validate?.() ?? true,
    release: () => {
      released.current = true
    },
  }))

  useEffect(() => {
    scope.guards.add(guard)
    return () => {
      scope.guards.delete(guard)
    }
  }, [scope, guard])

  return useCallback(
    async (leave: () => void) => {
      if (await confirm([guard])) leave()
    },
    [confirm, guard],
  )
}

// Version formulaire : compare la valeur saisie (`value`, sérialisée) à
// celle de référence. Tant que l'utilisateur n'a pas interagi avec la fiche
// (saisie, clic, touche dans l'élément `formRef`), la référence suit la
// valeur : les pré-remplissages asynchrones (société par défaut, données
// chargées après ouverture...) ne comptent donc pas comme des modifications.
export function useUnsavedForm(value: unknown, save: () => Promise<unknown> | void) {
  const serialized = JSON.stringify(value)
  const latest = useRef(serialized)
  const baseline = useRef(serialized)
  const touched = useRef(false)
  const root = useRef<HTMLElement | null>(null)

  useEffect(() => {
    latest.current = serialized
    if (!touched.current) baseline.current = serialized
  }, [serialized])

  const confirmLeave = useLeaveGuard({
    isDirty: () => touched.current && latest.current !== baseline.current,
    save,
    validate: () => {
      const element = root.current
      const form = element instanceof HTMLFormElement ? element : element?.querySelector('form')
      return form?.reportValidity() ?? true
    },
  })

  // Élément racine de la fiche, pour détecter la première interaction.
  const formRef = useCallback((element: HTMLElement | null) => {
    root.current = element
    if (!element) return
    const touch = () => {
      touched.current = true
    }
    const events = ['input', 'change', 'click', 'keydown'] as const
    for (const event of events) element.addEventListener(event, touch, true)
    return () => {
      for (const event of events) element.removeEventListener(event, touch, true)
    }
  }, [])

  // Après un enregistrement qui laisse la fiche ouverte : la valeur
  // enregistrée devient la référence (et les mises à jour renvoyées par le
  // serveur ne comptent pas comme des modifications).
  const markClean = useCallback(() => {
    touched.current = false
    baseline.current = latest.current
  }, [])

  return { formRef, confirmLeave, markClean }
}
