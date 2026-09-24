import { Fragment, useState, type MouseEvent, type ReactNode } from 'react'
import { useTable, type ColumnDef, type RowData } from '@tanstack/react-table'
import * as XLSX from 'xlsx'
import { features } from '../lib/tableFeatures.js'
import './DataTable.css'

type Props<T extends RowData> = {
  data: T[]
  columns: ColumnDef<typeof features, T>[]
  // Identifiant unique de chaque ligne (ex. `(s) => s.IDSOCIETES`) — permet
  // de savoir lesquelles sont sélectionnées. Requis dès que
  // `onSelectionChange` est fourni.
  getRowId?: (row: T) => string
  // Multisélection — fournir les deux active la colonne de cases à cocher.
  // Simple clic : sélectionne uniquement cette ligne, sans rien ouvrir.
  // Ctrl/Cmd+clic ou case à cocher : ajoute/retire la ligne. Maj+clic :
  // sélectionne la plage depuis la dernière ligne cliquée, dans l'ordre
  // affiché (donc après tri et filtres).
  selectedRowIds?: ReadonlySet<string>
  onSelectionChange?: (ids: Set<string>) => void
  // Double clic : ouvre la modale de modification (voir <Entite>Page.tsx
  // sous src/features/) — un simple clic ne l'ouvre plus, pour laisser le
  // simple clic sélectionner la ligne sans interrompre la lecture du
  // tableau.
  onRowDoubleClick?: (row: T) => void
  // Nom du fichier généré par le bouton Exporter (sans l'extension .xlsx)
  // — voir CrudPage.tsx, qui y passe le titre de la page.
  exportFileName?: string
  // Contenu placé à gauche du bouton Exporter (ex. le champ Rechercher de
  // CrudPage.tsx).
  toolbarStart?: ReactNode
  // Id de la ligne actuellement "dépliée" — une ligne supplémentaire
  // s'insère juste en dessous avec le contenu de `renderExpandedRow` (voir
  // RowExpandMode.tsx, sous components/view-modes/). Absent/null : aucune
  // ligne n'est dépliée, comportement inchangé.
  expandedRowId?: string | null
  renderExpandedRow?: () => ReactNode
}

// Petite icône entonnoir — ouvre/ferme le champ de filtre de sa colonne.
function FilterIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1 2h14l-5.5 6.2V14l-3-1.5V8.2z" />
    </svg>
  )
}

// Icône "feuille de calcul" pour le bouton Exporter en Excel.
function ExcelIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3.5" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v11.5" />
      <path d="M9.5 12.5l3 3.5" />
      <path d="M12.5 12.5l-3 3.5" />
    </svg>
  )
}

// La View générique : rend un tableau (tri au clic sur le libellé, filtre
// par colonne via l'icône entonnoir) pour n'importe quelle feature.
// Remplace les anciens SocietesTable.tsx / ContratsTable.tsx / ... qui
// étaient tous identiques à l'exception du type de `data`.
// Sous 768px (voir DataTable.css, aligné sur le seuil du menu burger),
// chaque ligne bascule en carte empilée label/valeur — au-dessus, le
// tableau garde ses colonnes et défile horizontalement plutôt que de
// les compresser.
export function DataTable<T extends RowData>({ data, columns, getRowId, selectedRowIds, onSelectionChange, onRowDoubleClick, exportFileName, toolbarStart, expandedRowId, renderExpandedRow }: Props<T>) {
  // Id de la colonne dont le champ de filtre est actuellement ouvert
  // (une seule à la fois), ou null si aucune.
  const [openFilterId, setOpenFilterId] = useState<string | null>(null)
  // Dernière ligne cliquée sans Maj — point de départ du Maj+clic.
  const [anchorId, setAnchorId] = useState<string | null>(null)

  const table = useTable({ features, columns, data })

  const selectable = Boolean(getRowId && selectedRowIds && onSelectionChange)
  const selection = selectedRowIds ?? new Set<string>()
  const visibleIds = getRowId ? table.getRowModel().rows.map((row) => getRowId(row.original)) : []
  const selectedVisibleCount = visibleIds.filter((id) => selection.has(id)).length
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length

  function toggleRow(id: string) {
    const next = new Set(selection)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setAnchorId(id)
    onSelectionChange?.(next)
  }

  function handleRowClick(event: MouseEvent, id: string) {
    if (!selectable) return
    if (event.shiftKey && anchorId && visibleIds.includes(anchorId)) {
      const [from, to] = [visibleIds.indexOf(anchorId), visibleIds.indexOf(id)].sort((a, b) => a - b)
      const range = visibleIds.slice(from, to + 1)
      // Maj+Ctrl ajoute la plage à la sélection existante, Maj seul la remplace.
      onSelectionChange?.(new Set(event.ctrlKey || event.metaKey ? [...selection, ...range] : range))
      return
    }
    if (event.ctrlKey || event.metaKey) {
      toggleRow(id)
      return
    }
    setAnchorId(id)
    onSelectionChange?.(new Set([id]))
  }

  // Case d'en-tête : coche/décoche toutes les lignes affichées (après
  // filtres), sans toucher aux lignes sélectionnées masquées par un filtre.
  function toggleAllVisible() {
    const next = new Set(selection)
    for (const id of visibleIds) {
      if (allVisibleSelected) next.delete(id)
      else next.add(id)
    }
    onSelectionChange?.(next)
  }

  // Exporte les lignes telles qu'affichées (triées/filtrées) plutôt que
  // `data` brute, en réutilisant les libellés de colonne déjà utilisés pour
  // l'affichage (voir data-label plus bas).
  function handleExportExcel() {
    const rows = table.getRowModel().rows.map((row) =>
      Object.fromEntries(
        row.getAllCells().map((cell) => {
          const header = cell.column.columnDef.header
          const label = typeof header === 'string' ? header : cell.column.id
          return [label, cell.getValue()]
        })
      )
    )
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')
    XLSX.writeFile(workbook, `${exportFileName ?? 'export'}.xlsx`)
  }

  return (
    <div className="data-table">
      <div className="data-table-toolbar">
        {toolbarStart}
        <button type="button" className="data-table-export-button" onClick={handleExportExcel}>
          <ExcelIcon />
          Exporter
        </button>
      </div>
      <table>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {selectable && (
                <th className="data-table-select-cell">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected
                    }}
                    onChange={toggleAllVisible}
                    disabled={visibleIds.length === 0}
                    aria-label="Tout sélectionner"
                  />
                </th>
              )}
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                const isFilterOpen = openFilterId === header.column.id
                const hasFilter = Boolean(header.column.getFilterValue())
                const columnHeader = header.column.columnDef.header
                const label = typeof columnHeader === 'string' ? columnHeader : header.column.id
                return (
                  <th key={header.id} data-label={label}>
                    <div className="data-table-header-row">
                      <span className="data-table-sort-label" onClick={header.column.getToggleSortingHandler()}>
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                        {sorted === 'asc' && ' ▲'}
                        {sorted === 'desc' && ' ▼'}
                      </span>
                      <button
                        className={`data-table-filter-button${hasFilter ? ' active' : ''}`}
                        onClick={() => setOpenFilterId(isFilterOpen ? null : header.column.id)}
                        aria-label={`Filtrer la colonne ${header.column.id}`}
                      >
                        <FilterIcon />
                      </button>
                    </div>
                    {isFilterOpen && (
                      <input
                        autoFocus
                        className="data-table-filter-input"
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                        placeholder="Filtrer..."
                      />
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const id = getRowId?.(row.original)
            const isSelected = id !== undefined && selection.has(id)
            const isClickable = selectable || Boolean(onRowDoubleClick)
            const cells = row.getAllCells()
            const isExpanded = id !== undefined && id === expandedRowId
            return (
              <Fragment key={row.id}>
                <tr
                  className={`data-table-row${isClickable ? ' clickable' : ''}${isSelected ? ' selected' : ''}`}
                  // Empêche le navigateur de surligner le texte au Maj+clic.
                  onMouseDown={(e) => {
                    if (e.shiftKey && selectable) e.preventDefault()
                  }}
                  onClick={(e) => id !== undefined && handleRowClick(e, id)}
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                >
                  {selectable && id !== undefined && (
                    <td className="data-table-select-cell" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(id)} aria-label="Sélectionner la ligne" />
                    </td>
                  )}
                  {cells.map((cell) => {
                    const header = cell.column.columnDef.header
                    const label = typeof header === 'string' ? header : cell.column.id
                    return (
                      <td key={cell.id} data-label={label}>
                        <table.FlexRender cell={cell} />
                      </td>
                    )
                  })}
                </tr>
                {isExpanded && renderExpandedRow && (
                  <tr className="data-table-expanded-row">
                    <td colSpan={cells.length + (selectable ? 1 : 0)}>{renderExpandedRow()}</td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {table.getRowModel().rows.length === 0 && (
            <tr className="data-table-empty-row">
              <td colSpan={columns.length + (selectable ? 1 : 0)}>Aucun résultat</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
