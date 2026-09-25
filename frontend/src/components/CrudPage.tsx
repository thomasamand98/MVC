import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { ColumnDef, RowData } from '@tanstack/react-table'
import { features } from '../lib/tableFeatures.js'
import { useTabsContext } from '../layout/TabsContext.js'
import { DataTable } from './DataTable.js'
import { PageActions } from './PageActions.js'
import { TableSearch } from './TableSearch.js'
import { ProjectionButton } from './projection/ProjectionButton.js'
import { useProjection } from './projection/ProjectionContext.js'
import { RELATIONS, type EntityKey } from './projection/relations.js'
import { ROW_EXPAND_MODE_ID, RowFicheContent } from './view-modes/RowExpandMode.js'
import { TAB_MODE_ID } from './view-modes/TabMode.js'
import { VIEW_MODE_SELECTION_ENABLED, useViewModePreference } from './view-modes/useViewModePreference.js'
import { ViewModeSelector } from './view-modes/ViewModeSelector.js'
import { viewModes } from './view-modes/index.js'
import { GuardBoundary } from './unsaved-changes/UnsavedChangesProvider.js'
import { useConfirmLeave, useGuardScope } from './unsaved-changes/UnsavedChangesContext.js'
import './CrudPage.css'

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

type FormRenderProps<TDetail, TDto> = {
  initial: TDetail | null
  onSubmit: (dto: TDto) => Promise<void>
  onCancel: () => void
}

type PaginationProps = {
  page: number
  pageSize: number
  // Nombre total de lignes côté serveur (pas juste celles de la page
  // affichée) — voir useApiList.ts/ApiListPagination.
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  // Recherche serveur sur toutes les colonnes texte (voir TableSearch.tsx et
  // useApiList.ts) — fournir onSearchChange affiche le champ Rechercher.
  search?: string
  onSearchChange?: (search: string) => void
}

type Props<T extends RowData, TDto, TDetail> = {
  title: string
  loadingLabel: string
  data: T[]
  setData: Dispatch<SetStateAction<T[]>>
  loading: boolean
  error: string | null
  columns: ColumnDef<typeof features, T>[]
  getRowId: (row: T) => string
  create: (dto: TDto) => Promise<T>
  update: (id: string, dto: Partial<TDto>) => Promise<T>
  remove: (id: string) => Promise<void>
  // Récupère la fiche complète d'un enregistrement avant d'ouvrir la modale
  // d'édition, pour les features dont le formulaire a besoin de plus de
  // champs que ceux chargés par la liste (voir ContactsPage.tsx). Absent :
  // la modale s'ouvre directement avec la ligne du tableau, comme avant.
  getDetail?: (id: string) => Promise<TDetail>
  // Active la pagination serveur (voir CommandesPage.tsx) : affiche la barre
  // page/taille de page sous le tableau, et le compteur du titre utilise
  // `total` (nombre réel de lignes) plutôt que `data.length` (juste la page
  // affichée). Nécessite `refetch`, appelé après chaque create/update/delete
  // à la place de la mise à jour locale — la page courante peut ne plus
  // contenir la ligne modifiée après un rechargement serveur.
  pagination?: PaginationProps
  refetch?: () => void
  deleteConfirmMessage: string
  createModalTitle: string
  editModalTitle: string
  // Rend le formulaire de saisie — permet à chaque feature de passer ses
  // props additionnelles (ex. la liste des sociétés pour ContratForm/
  // PointForm) sans que CrudPage ait à les connaître.
  renderForm: (props: FormRenderProps<TDetail, TDto>) => ReactNode
  // Distingue l'onglet de création quand plusieurs tables de la même entité
  // coexistent avec des valeurs par défaut différentes (ex. onglet Contrats
  // de chaque fiche Société, voir SocieteContratsTab.tsx) — sinon un seul
  // onglet « Nouveau » par titre.
  newRecordScope?: string
  // Table affichée (voir projection/relations.ts) : active le bouton
  // Projection vers ses tables liées.
  entity?: EntityKey
  // En-tête affiché à la place de `title` (ex. « Contrats de 3 sociétés »
  // pour un résultat de projection) — `title` reste utilisé pour les
  // identifiants d'onglet des fiches.
  heading?: string
  // Filtres affichés à droite du champ Rechercher (ex. ArchiveFilter sur
  // ChauffeursPage.tsx) — la page gère leur état et les passe à son hook.
  toolbarExtra?: ReactNode
}

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes. Factorisé ici car <Entite>Page.tsx suivaient tous
// exactement cette même logique, seuls les libellés, les colonnes et le
// formulaire changeant (voir <Entite>Page.tsx sous src/features/).
export function CrudPage<T extends RowData, TDto, TDetail = T>({
  title,
  loadingLabel,
  data,
  setData,
  loading,
  error,
  columns,
  getRowId,
  create,
  update,
  remove,
  getDetail,
  pagination,
  refetch,
  deleteConfirmMessage,
  createModalTitle,
  editModalTitle,
  renderForm,
  newRecordScope,
  entity,
  heading,
  toolbarExtra,
}: Props<T, TDto, TDetail>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  // Ligne ouverte en modification (double clic) — distincte de la sélection,
  // qui peut contenir plusieurs lignes.
  const [editId, setEditId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editRecord, setEditRecord] = useState<TDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [viewModeId, setViewModeId] = useViewModePreference()
  const { openOrActivateTab, closeTab } = useTabsContext()
  const projection = useProjection()
  // Zone de la fiche ouverte (voir components/unsaved-changes/) : la fermer,
  // ou en ouvrir une autre à sa place, demande d'abord quoi faire d'une
  // saisie modifiée.
  const formScope = useGuardScope()
  const confirmLeave = useConfirmLeave()
  // Passe à true au premier chargement terminé : les rechargements suivants
  // (page, recherche, après enregistrement) gardent la page affichée — sinon
  // le champ Rechercher serait démonté à chaque frappe et perdrait le focus.
  const [hasLoaded, setHasLoaded] = useState(false)
  if (!loading && !hasLoaded) setHasLoaded(true)

  if (!hasLoaded) {
    if (error) return <p>Erreur : {error}</p>
    return <p>{loadingLabel}</p>
  }

  const isTabMode = viewModeId === TAB_MODE_ID

  // Quitte la fiche ouverte (croix, fond, Annuler...) après confirmation si
  // elle a été modifiée.
  async function requestCloseForm() {
    if (await confirmLeave(formScope)) setModalMode(null)
  }

  // Ne garde que les ids encore présents dans `data` — une ligne sélectionnée
  // peut disparaître (changement de page, rechargement serveur) sans que
  // la sélection ne soit remise à zéro explicitement.
  const loadedIds = new Set(data.map(getRowId))
  const selection = new Set([...selectedIds].filter((id) => loadedIds.has(id)))

  // Mode "Onglet" (voir view-modes/TabMode.tsx) : un id stable par
  // enregistrement, pour réactiver son onglet plutôt que d'en rouvrir un
  // second au redouble-clic.
  function recordTabId(recordId: string | null): string {
    if (recordId) return `record:${title}:${recordId}`
    return newRecordScope ? `record:${title}:new:${newRecordScope}` : `record:${title}:new`
  }

  // Libellé de l'onglet d'une ligne : nom de la page + valeur de la
  // première colonne affichée (ex. « Sociétés: YARA TERTRE »), avec repli
  // sur l'id si la première colonne n'est pas un accesseur simple.
  function getRowLabel(row: T): string {
    const firstColumn = columns[0] as unknown as { accessorKey?: string } | undefined
    const key = firstColumn?.accessorKey
    const value = key ? (row as unknown as Record<string, unknown>)[key] : undefined
    return value !== null && value !== undefined && value !== '' ? String(value) : getRowId(row)
  }

  async function handleSubmitTab(mode: 'create' | 'edit', recordId: string | null, dto: TDto) {
    const tabId = recordTabId(recordId)
    try {
      if (mode === 'edit' && recordId) {
        const updated = await update(recordId, dto)
        if (pagination && refetch) {
          await refetch()
        } else {
          setData((prev) => prev.map((row) => (getRowId(row) === recordId ? updated : row)))
        }
      } else {
        const created = await create(dto)
        if (pagination && refetch) {
          await refetch()
        } else {
          setData((prev) => [...prev, created])
        }
      }
      // Juste enregistré : rien à confirmer.
      closeTab(tabId, { force: true })
    } catch (err) {
      alert(`Échec de l'enregistrement : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    }
  }

  // Ouvre la fiche de `recordId` (ou une fiche de création si null) dans
  // son propre onglet — voir TabsContext.tsx, fourni par AppLayout.tsx.
  function openRecordTab(mode: 'create' | 'edit', recordId: string | null, initial: TDetail | null, label: string) {
    const tabId = recordTabId(recordId)
    const content = renderForm({
      initial,
      onSubmit: (dto) => handleSubmitTab(mode, recordId, dto),
      onCancel: () => closeTab(tabId),
    })
    openOrActivateTab({ id: tabId, label, content })
  }

  async function handleRowDoubleClickTab(row: T) {
    const id = getRowId(row)
    const label = `${title}: ${getRowLabel(row)}`
    if (!getDetail) {
      openRecordTab('edit', id, row as unknown as TDetail, label)
      return
    }
    try {
      openRecordTab('edit', id, await getDetail(id), label)
    } catch (err) {
      alert(`Échec du chargement : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    }
  }

  async function handleRowDoubleClick(row: T) {
    if (isTabMode) {
      await handleRowDoubleClickTab(row)
      return
    }
    if (detailLoading) return
    const id = getRowId(row)
    // Déjà ouverte : on garde la saisie en cours.
    if (modalMode === 'edit' && editId === id) return
    if (modalMode && !(await confirmLeave(formScope))) return
    setSelectedIds(new Set([id]))
    setEditId(id)
    if (!getDetail) {
      // Pas de fiche détaillée à charger : la ligne du tableau sert
      // directement de valeurs initiales (TDetail vaut T par défaut).
      setEditRecord(row as unknown as TDetail)
      setModalMode('edit')
      return
    }
    setDetailLoading(true)
    try {
      setEditRecord(await getDetail(id))
      setModalMode('edit')
    } catch (err) {
      alert(`Échec du chargement : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setDetailLoading(false)
    }
  }

  // Supprime toutes les lignes sélectionnées, une requête par ligne. Les
  // échecs (ex. ligne encore référencée ailleurs) n'empêchent pas les
  // autres suppressions : les lignes en échec restent sélectionnées.
  async function handleDelete() {
    const ids = [...selection]
    if (ids.length === 0) return
    const message = ids.length === 1 ? deleteConfirmMessage : `Supprimer les ${ids.length} éléments sélectionnés ?`
    if (!confirm(message)) return
    const results = await Promise.allSettled(ids.map((id) => remove(id)))
    const deleted = new Set(ids.filter((_, i) => results[i].status === 'fulfilled'))
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (deleted.size > 0) {
      if (pagination && refetch) {
        await refetch()
      } else {
        setData((prev) => prev.filter((row) => !deleted.has(getRowId(row))))
      }
    }
    setSelectedIds(new Set(ids.filter((id) => !deleted.has(id))))
    if (failures.length > 0) {
      const reason = failures[0].reason
      const detail = reason instanceof Error ? reason.message : 'erreur inconnue'
      alert(
        ids.length === 1
          ? `Échec de la suppression : ${detail}`
          : `${failures.length} suppression(s) sur ${ids.length} ont échoué : ${detail}`
      )
    }
  }

  async function handleSubmit(dto: TDto) {
    try {
      if (modalMode === 'edit' && editId) {
        const updated = await update(editId, dto)
        if (pagination && refetch) {
          await refetch()
        } else {
          setData((prev) => prev.map((row) => (getRowId(row) === editId ? updated : row)))
        }
      } else {
        const created = await create(dto)
        if (pagination && refetch) {
          await refetch()
        } else {
          setData((prev) => [...prev, created])
        }
      }
      setModalMode(null)
    } catch (err) {
      alert(`Échec de l'enregistrement : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    }
  }

  const totalCount = pagination?.total ?? data.length

  const ModeComponent = viewModes.find((m) => m.id === viewModeId)?.Component ?? viewModes[0].Component

  const formTitle = modalMode === 'edit' ? editModalTitle : createModalTitle
  const formContent = modalMode
    ? (
        // key : une autre fiche ouverte à la place repart de ses propres
        // valeurs (sinon le formulaire garderait l'état du précédent).
        <GuardBoundary key={`${modalMode}:${editId ?? 'new'}`} scope={formScope}>
          {renderForm({ initial: modalMode === 'edit' ? editRecord : null, onSubmit: handleSubmit, onCancel: () => void requestCloseForm() })}
        </GuardBoundary>
      )
    : null

  // Mode "Ligne + bloc" (voir RowExpandMode.tsx) : la modification déplie la
  // ligne directement dans le tableau au lieu d'utiliser le bloc du haut —
  // le formulaire ne va donc que dans un seul des deux emplacements à la
  // fois (jamais les deux, pour ne pas monter le formulaire deux fois).
  const isRowExpandMode = viewModeId === ROW_EXPAND_MODE_ID
  const modeFormSlot = isRowExpandMode ? (modalMode === 'create' ? formContent : null) : formContent

  const tableArea = (
    <>
      {error && <p className="crud-page-error">Erreur : {error}</p>}
      <DataTable
        data={data}
        columns={columns}
        getRowId={getRowId}
        selectedRowIds={selection}
        onSelectionChange={setSelectedIds}
        onRowDoubleClick={handleRowDoubleClick}
        exportFileName={title}
        toolbarStart={
          <>
            {pagination?.onSearchChange && <TableSearch value={pagination.search ?? ''} onChange={pagination.onSearchChange} />}
            {toolbarExtra}
          </>
        }
        expandedRowId={isRowExpandMode && modalMode === 'edit' ? editId : null}
        renderExpandedRow={
          isRowExpandMode && modalMode === 'edit'
            ? () => (
                <RowFicheContent title={formTitle} onClose={() => void requestCloseForm()}>
                  {formContent}
                </RowFicheContent>
              )
            : undefined
        }
      />
      {pagination && (() => {
        // pageSize=0 ("Tous") : une seule page, le back renvoie tout sans
        // découpage (voir CommandeService.getCommandes et les autres
        // services — pageSize<=0 y désactive le skip/take).
        const pageCount = pagination.pageSize > 0 ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1
        return (
          <div className="pagination-bar">
            <span className="pagination-info">
              Page <span className="pagination-page">{pagination.page}</span> / {pageCount} — {pagination.total} résultat{pagination.total > 1 ? 's' : ''}
            </span>
            <div className="pagination-controls">
              <select
                className="pagination-size"
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                aria-label="Résultats par page"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={0}>Tous</option>
              </select>
              <div className="pagination-nav">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={pagination.page <= 1}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  aria-label="Page précédente"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  className="pagination-button"
                  disabled={pagination.page >= pageCount}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  aria-label="Page suivante"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )

  return (
    <div>
      <div className="page-header">
        <h2>{heading ?? title} ({totalCount})</h2>
        <div className="page-header-actions">
          {VIEW_MODE_SELECTION_ENABLED && <ViewModeSelector
              value={viewModeId}
              onChange={async (id) => {
                // Changer de mode remonte la fiche ouverte ailleurs : sa saisie serait perdue.
                if (modalMode && !(await confirmLeave(formScope))) return
                setModalMode(null)
                setViewModeId(id)
              }}
            />}
          <PageActions
            onCreate={async () => {
              if (isTabMode) {
                openRecordTab('create', null, null, createModalTitle)
                return
              }
              if (modalMode === 'create') return
              if (modalMode && !(await confirmLeave(formScope))) return
              setSelectedIds(new Set())
              setEditId(null)
              setModalMode('create')
            }}
            onEdit={() => {
              const [id] = selection
              const row = data.find((r) => getRowId(r) === id)
              if (row) void handleRowDoubleClick(row)
            }}
            onDelete={handleDelete}
            selectedCount={selection.size}
          />
          {entity && projection && RELATIONS[entity].length > 0 && (
            <ProjectionButton
              relations={RELATIONS[entity]}
              selectedCount={selection.size}
              onSelect={(target) => {
                const ids = [...selection]
                const single = ids.length === 1 ? data.find((row) => getRowId(row) === ids[0]) : undefined
                projection.openProjection({ source: entity, target, ids, singleLabel: single ? getRowLabel(single) : undefined })
              }}
            />
          )}
        </div>
      </div>
      <ModeComponent
        open={Boolean(modalMode)}
        mode={modalMode}
        title={formTitle}
        onClose={() => void requestCloseForm()}
        table={tableArea}
        form={modeFormSlot}
      />
    </div>
  )
}
