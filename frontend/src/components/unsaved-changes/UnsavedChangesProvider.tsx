import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmLeaveContext, GuardScopeContext, useGuardScope } from './UnsavedChangesContext.js'
import { dirtyGuardsOf, GuardScope, type LeaveGuard, type LeaveTarget } from './scope.js'
import './UnsavedChangesDialog.css'

type Pending = { target: LeaveTarget; guards: LeaveGuard[]; resolve: (canLeave: boolean) => void }

// Laisse React appliquer les mises à jour déclenchées par l'enregistrement
// (fiche refermée, état « propre ») avant de vérifier le résultat.
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

async function settled(target: LeaveTarget): Promise<boolean> {
  for (let attempt = 0; attempt < 10; attempt++) {
    await nextFrame()
    if (dirtyGuardsOf(target).length === 0) return true
  }
  return false
}

// Racine du suivi des saisies non enregistrées (voir scope.ts) : fournit la
// zone de l'application, affiche le dialogue « Enregistrer / Annuler les
// modifications » quand on quitte une zone modifiée, et prévient le
// navigateur à la fermeture ou au rechargement de la page.
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [root] = useState(() => new GuardScope(null))
  const [pending, setPending] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)
  const pendingRef = useRef<Pending | null>(null)

  const confirmLeave = useCallback((target: LeaveTarget) => {
    const guards = dirtyGuardsOf(target)
    if (guards.length === 0) return Promise.resolve(true)
    // Une seule question à la fois : une demande pendant qu'une autre est
    // affichée est refusée (double clic sur une croix, par exemple).
    if (pendingRef.current) return Promise.resolve(false)
    return new Promise<boolean>((resolve) => {
      const request = { target, guards, resolve }
      pendingRef.current = request
      setPending(request)
    })
  }, [])

  const finish = useCallback((canLeave: boolean) => {
    const request = pendingRef.current
    pendingRef.current = null
    setPending(null)
    setSaving(false)
    request?.resolve(canLeave)
  }, [])

  async function handleSave() {
    const request = pendingRef.current
    if (!request) return
    // Saisie invalide : on reste sur la fiche, le navigateur signale le champ.
    if (!request.guards.every((guard) => guard.validate())) {
      finish(false)
      return
    }
    setSaving(true)
    try {
      for (const guard of request.guards) await guard.save()
    } catch {
      // Erreur déjà affichée par la saisie elle-même.
    }
    finish(await settled(request.target))
  }

  function handleDiscard() {
    pendingRef.current?.guards.forEach((guard) => guard.release())
    finish(true)
  }

  // Fermeture/rechargement de l'onglet du navigateur : seul le message
  // standard du navigateur peut s'afficher à ce moment-là.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (root.dirtyGuards().length === 0) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [root])

  useEffect(() => {
    if (!pending) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        event.stopPropagation()
        finish(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [pending, saving, finish])

  return (
    <ConfirmLeaveContext.Provider value={confirmLeave}>
      <GuardScopeContext.Provider value={root}>
        {children}
        {pending && (
          <div className="unsaved-overlay" onClick={() => !saving && finish(false)}>
            <div
              className="unsaved-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="unsaved-title"
              aria-describedby="unsaved-text"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="unsaved-header">
                <h3 id="unsaved-title" className="unsaved-title">Modifications non enregistrées</h3>
                <button type="button" className="icon-btn sm" onClick={() => finish(false)} disabled={saving} aria-label="Continuer la saisie">
                  ×
                </button>
              </div>
              <p id="unsaved-text" className="unsaved-text">
                Cet élément a été modifié. Que voulez-vous faire des modifications avant de le quitter ?
              </p>
              <div className="unsaved-actions">
                <button type="button" className="btn" onClick={handleDiscard} disabled={saving}>
                  Annuler les modifications
                </button>
                {/* autoFocus : Entrée enregistre, le choix le plus sûr. */}
                <button type="button" className="btn primary" onClick={() => void handleSave()} disabled={saving} autoFocus>
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        )}
      </GuardScopeContext.Provider>
    </ConfirmLeaveContext.Provider>
  )
}

// Délimite une zone (onglet, fiche, modale...) : les saisies affichées à
// l'intérieur y sont rattachées. `scope` vient de useGuardScope() quand le
// parent doit pouvoir la vérifier ; sinon une zone propre est créée.
export function GuardBoundary({ scope, children }: { scope?: GuardScope; children: ReactNode }) {
  if (scope) return <GuardScopeContext.Provider value={scope}>{children}</GuardScopeContext.Provider>
  return <OwnScopeBoundary>{children}</OwnScopeBoundary>
}

function OwnScopeBoundary({ children }: { children: ReactNode }) {
  const scope = useGuardScope()
  return <GuardScopeContext.Provider value={scope}>{children}</GuardScopeContext.Provider>
}
