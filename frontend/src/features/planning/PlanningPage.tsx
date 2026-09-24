import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { ColumnView } from './ColumnView.js'
import { RowView } from './RowView.js'
import { ExecutionDetails } from './ExecutionDetails.js'
import { PlanningSidebar } from './PlanningSidebar.js'
import { resourceIdOf, UNASSIGNED_ID, type BoardProps } from './board.js'
import { addDays, daysInRange, formatMoney, formatWeekday, fromInputValue, MINUTE_MS, startOfWeek, toInputValue } from './dateUtils.js'
import { usePlanning, type MoveChanges } from './usePlanning.js'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ColumnsIcon, PanelIcon, RowsIcon } from './icons.js'
import type { Chauffeur, DragItem, DropPreview, GroupBy, PlanningExecution, PlanningResource, ViewMode } from './types.js'
import './Planning.css'

// Au-delà, la grille devient illisible et trop lourde à afficher (le
// backend refuse aussi les périodes trop longues).
const MAX_DAYS = 31
// Période affichée à l’ouverture et par « Cette semaine » : du lundi au
// dimanche de la semaine en cours.
const DEFAULT_DAYS = 7
const PREFS_STORAGE_KEY = 'mvc-template:planningPrefs'
const SAVED_NOTICE_MS = 2500

type Prefs = { viewMode: ViewMode; groupBy: GroupBy }
type Notice = { kind: 'saved' } | { kind: 'error'; message: string }

function readPrefs(): Prefs {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? 'null') as Partial<Prefs> | null
    return {
      viewMode: stored?.viewMode === 'ligne' ? 'ligne' : 'colonne',
      groupBy: stored?.groupBy === 'remorque' ? 'remorque' : 'executant',
    }
  } catch {
    return { viewMode: 'colonne', groupBy: 'executant' }
  }
}

// Chauffeur / tracteur / remorque d'une exécution créée en déposant une
// commande sur une ressource : complétés avec l'attelage de référence.
function assignmentFor(target: string | null, groupBy: GroupBy, chauffeurs: Chauffeur[]) {
  if (groupBy === 'executant') {
    const chauffeur = chauffeurs.find((c) => c.id === target)
    return { chauffeurId: target, tracteurId: chauffeur?.tracteurParDefautId ?? null, remorqueId: chauffeur?.remorqueParDefautId ?? null }
  }
  const chauffeur = target ? chauffeurs.find((c) => c.remorqueParDefautId === target) : undefined
  return { chauffeurId: chauffeur?.id ?? null, tracteurId: chauffeur?.tracteurParDefautId ?? null, remorqueId: target }
}

// Écran Planning (menu Production) : filtre de période, panneau des
// commandes / déchargements en attente, et grille en mode « Colonne » (une
// colonne par ressource) ou « Ligne » (une ligne par ressource).
// Chaque glisser-déposer est enregistré aussitôt en base (voir
// usePlanning.ts) : déplacer une carte change ses dates et sa ressource,
// tirer sa poignée change sa fin, déposer une commande crée une exécution.
export function PlanningPage() {
  const [from, setFrom] = useState(() => startOfWeek(new Date()))
  const [to, setTo] = useState(() => addDays(startOfWeek(new Date()), DEFAULT_DAYS - 1))
  const [prefs, setPrefs] = useState(readPrefs)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [preview, setPreview] = useState<DropPreview | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const noticeTimer = useRef<number | undefined>(undefined)
  const { viewMode, groupBy } = prefs
  const planning = usePlanning(from, to)
  const { data, loading, saving } = planning

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // Stockage indisponible (navigation privée) : préférences non retenues.
    }
  }, [prefs])

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  function showNotice(next: Notice) {
    window.clearTimeout(noticeTimer.current)
    setNotice(next)
    if (next.kind === 'saved') noticeTimer.current = window.setTimeout(() => setNotice(null), SAVED_NOTICE_MS)
  }

  const showError = (err: unknown) => showNotice({ kind: 'error', message: err instanceof Error ? err.message : "L'enregistrement a échoué." })

  const chauffeurs = data?.chauffeurs ?? []
  const days = daysInRange(from, to)
  const periodStart = from.getTime()
  const periodEnd = addDays(to, 1).getTime()
  const executions = (data?.executions ?? []).filter((e) => e.end > periodStart && e.start < periodEnd)

  const resources: PlanningResource[] =
    groupBy === 'executant'
      ? chauffeurs.map((c) => ({ id: c.id, label: c.nom, sublabel: c.sousTraitant ?? (c.tracteurParDefaut ? `Interne · ${c.tracteurParDefaut}` : 'Interne') }))
      : (data?.remorques ?? []).map((r) => ({ id: r.id, label: r.immat, sublabel: r.type }))
  // Toujours proposée pendant un glisser, pour pouvoir désaffecter.
  if (dragItem || executions.some((e) => resourceIdOf(e, groupBy) === UNASSIGNED_ID)) {
    resources.push({ id: UNASSIGNED_ID, label: 'Non affecté', sublabel: null })
  }

  const caByResource = new Map<string, number>()
  const countByResource = new Map<string, number>()
  for (const e of executions) {
    const id = resourceIdOf(e, groupBy)
    caByResource.set(id, (caByResource.get(id) ?? 0) + e.montant)
    countByResource.set(id, (countByResource.get(id) ?? 0) + 1)
  }
  const totalCa = executions.reduce((sum, e) => sum + e.montant, 0)
  const selected = data?.executions.find((e) => e.id === selectedId) ?? null
  const chauffeurNom = (id: string | null) => chauffeurs.find((c) => c.id === id)?.nom ?? null

  // --- Période -----------------------------------------------------------

  function changeFrom(value: string) {
    const date = fromInputValue(value)
    if (!date) return
    setFrom(date)
    if (date > to) setTo(date)
    else if (daysInRange(date, to).length > MAX_DAYS) setTo(addDays(date, MAX_DAYS - 1))
  }

  function changeTo(value: string) {
    const date = fromInputValue(value)
    if (!date) return
    setTo(date)
    if (date < from) setFrom(date)
    else if (daysInRange(from, date).length > MAX_DAYS) setFrom(addDays(date, -(MAX_DAYS - 1)))
  }

  // Décale la période de sa propre durée (semaine précédente / suivante
  // pour une période d'une semaine).
  function shiftPeriod(direction: -1 | 1) {
    const length = days.length <= 7 ? 7 : days.length
    setFrom(addDays(from, direction * length))
    setTo(addDays(to, direction * length))
  }

  function resetToCurrentWeek() {
    const monday = startOfWeek(new Date())
    setFrom(monday)
    setTo(addDays(monday, DEFAULT_DAYS - 1))
  }

  // --- Glisser-déposer ---------------------------------------------------

  const handleDragStartItem = useCallback((item: DragItem, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.setData('text/plain', item.id)
    event.dataTransfer.effectAllowed = item.kind === 'execution' ? 'move' : 'copy'
    // Différé : modifier le DOM pendant le dragstart annule le glisser dans
    // certains navigateurs.
    requestAnimationFrame(() => setDragItem(item))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragItem(null)
    setPreview(null)
  }, [])

  async function handleDrop(resourceId: string, start: number) {
    const item = dragItem
    handleDragEnd()
    if (!item || !data) return
    const end = start + item.durationMinutes * MINUTE_MS
    const target = resourceId === UNASSIGNED_ID ? null : resourceId
    const resourceChange: Partial<MoveChanges> = groupBy === 'executant' ? { chauffeurId: target } : { remorqueId: target }

    try {
      if (item.kind === 'execution') {
        const execution = data.executions.find((e) => e.id === item.id)
        if (!execution) return
        const changesResource = resourceIdOf(execution, groupBy) !== resourceId
        if (!changesResource && execution.start === start && execution.end === end) return
        setSelectedId(execution.id)
        await planning.moveExecution(execution, { start, end, ...(changesResource ? resourceChange : {}) })
      } else if (item.kind === 'commande') {
        const id = await planning.createFromCommande({ commandeId: item.id, start, end, ...assignmentFor(target, groupBy, chauffeurs) })
        setSelectedId(id)
      } else {
        await planning.placeDechargement(item.id, { start, end, ...resourceChange })
        setSelectedId(item.id)
      }
      showNotice({ kind: 'saved' })
    } catch (err) {
      showError(err)
    }
  }

  async function handleResizeEnd(execution: PlanningExecution, end: number) {
    try {
      await planning.moveExecution(execution, { start: execution.start, end })
      showNotice({ kind: 'saved' })
    } catch (err) {
      showError(err)
    }
  }

  async function handleRemove(id: string) {
    try {
      await planning.removeExecution(id)
      if (selectedId === id) setSelectedId(null)
      showNotice({ kind: 'saved' })
    } catch (err) {
      showError(err)
    }
  }

  const closeDetails = useCallback(() => setSelectedId(null), [])

  const boardProps: BoardProps = {
    days,
    resources,
    executions,
    groupBy,
    caByResource,
    countByResource,
    selectedId,
    dragItem,
    preview,
    onSelect: setSelectedId,
    onDragStartItem: handleDragStartItem,
    onDragEnd: handleDragEnd,
    onPreview: setPreview,
    onDrop: (resourceId, start) => void handleDrop(resourceId, start),
    onResizeEnd: (execution, end) => void handleResizeEnd(execution, end),
  }

  return (
    <div className={`planning${dragItem ? ' is-dragging' : ''}`}>
      <header className="pl-toolbar">
        <div className="pl-toolbar-group">
          <button
            type="button"
            className={`pl-icon-btn pl-side-toggle${sidebarOpen ? ' is-active' : ''}`}
            onClick={() => setSidebarOpen((open) => !open)}
            aria-pressed={sidebarOpen}
            aria-label={sidebarOpen ? 'Masquer le panneau des commandes' : 'Afficher le panneau des commandes'}
            title={sidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
          >
            <PanelIcon />
          </button>
          <h2 className="pl-title">Planning</h2>
        </div>

        <div className="pl-toolbar-group pl-period" role="group" aria-label="Période du planning">
          <button type="button" className="pl-icon-btn" onClick={() => shiftPeriod(-1)} aria-label="Période précédente"><ChevronLeftIcon /></button>
          <label className="pl-date">
            <span>Du</span>
            <span className="pl-date-weekday">{formatWeekday(from)}</span>
            <input type="date" value={toInputValue(from)} onChange={(e) => changeFrom(e.target.value)} />
          </label>
          <label className="pl-date">
            <span>au</span>
            <span className="pl-date-weekday">{formatWeekday(to)}</span>
            <input type="date" value={toInputValue(to)} onChange={(e) => changeTo(e.target.value)} />
          </label>
          <button type="button" className="pl-icon-btn" onClick={() => shiftPeriod(1)} aria-label="Période suivante"><ChevronRightIcon /></button>
          <button type="button" className="pl-btn" onClick={resetToCurrentWeek}>Cette semaine</button>
        </div>

        <div className="pl-toolbar-group">
          <div className="pl-segmented" role="group" aria-label="Regrouper par">
            {(['executant', 'remorque'] as const).map((value) => (
              <button key={value} type="button" className={groupBy === value ? 'is-active' : ''} aria-pressed={groupBy === value} onClick={() => setPrefs((p) => ({ ...p, groupBy: value }))}>
                {value === 'executant' ? 'Exécutant' : 'Remorque'}
              </button>
            ))}
          </div>
          <div className="pl-segmented" role="group" aria-label="Affichage">
            <button type="button" className={viewMode === 'colonne' ? 'is-active' : ''} aria-pressed={viewMode === 'colonne'} onClick={() => setPrefs((p) => ({ ...p, viewMode: 'colonne' }))}>
              <ColumnsIcon /> Colonnes
            </button>
            <button type="button" className={viewMode === 'ligne' ? 'is-active' : ''} aria-pressed={viewMode === 'ligne'} onClick={() => setPrefs((p) => ({ ...p, viewMode: 'ligne' }))}>
              <RowsIcon /> Lignes
            </button>
          </div>
        </div>

        <div className="pl-kpis">
          <div className="pl-kpi">
            <span>Exécutions</span>
            <strong>{executions.length}</strong>
          </div>
          <div className="pl-kpi pl-kpi--accent">
            <span>CA planning</span>
            <strong>{formatMoney(totalCa)}</strong>
          </div>
        </div>
      </header>

      <div className={`pl-body${sidebarOpen ? '' : ' is-collapsed'}`}>
        {sidebarOpen && (
          <PlanningSidebar
            commandes={data?.commandes ?? []}
            dechargements={data?.dechargements ?? []}
            chauffeurNom={chauffeurNom}
            onDragStartItem={handleDragStartItem}
            onDragEnd={handleDragEnd}
            onDeleteDechargement={(id) => void handleRemove(id)}
          />
        )}

        <div className={`pl-board${loading && data ? ' is-loading' : ''}`} aria-busy={loading}>
          {!data && loading && <p className="pl-board-message">Chargement du planning…</p>}
          {!data && !loading && planning.error && (
            <div className="pl-board-message" role="alert">
              <p>{planning.error}</p>
              <button type="button" className="pl-btn" onClick={planning.reload}>Réessayer</button>
            </div>
          )}
          {data && resources.length === 0 && (
            <p className="pl-board-message">
              {groupBy === 'executant'
                ? 'Aucun chauffeur actif. Ajoutez-en dans Gestion attelage → Chauffeurs.'
                : 'Aucune remorque utilisée dans un attelage. Créez des attelages dans Gestion attelage → Attelages.'}
            </p>
          )}
          {data && resources.length > 0 && (viewMode === 'colonne' ? <ColumnView {...boardProps} /> : <RowView {...boardProps} />)}

          {selected && (
            <ExecutionDetails
              execution={selected}
              chauffeurNom={chauffeurNom(selected.chauffeurId)}
              onClose={closeDetails}
            />
          )}

          {(saving || notice) && (
            <div className={`pl-notice${notice?.kind === 'error' && !saving ? ' pl-notice--error' : ''}`} role={notice?.kind === 'error' ? 'alert' : 'status'}>
              {saving ? 'Enregistrement…' : notice?.kind === 'saved' ? 'Modifications enregistrées' : notice?.message}
              {!saving && notice?.kind === 'error' && (
                <button type="button" className="pl-notice-close" onClick={() => setNotice(null)} aria-label="Fermer le message"><CloseIcon /></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
