import { Fragment, useState, type ReactNode } from 'react'
import { useTable, type ColumnDef, type RowData } from '@tanstack/react-table'
import * as XLSX from 'xlsx'
import { features } from '../lib/tableFeatures.js'
import './DataTable.css'

type Props<T extends RowData> = {
  data: T[]
  columns: ColumnDef<typeof features, T>[]
  // Identifiant unique de chaque ligne (ex. `(s) => s.IDSOCIETES`) — permet
  // de savoir laquelle est sélectionnée. Requis dès que `onRowClick` est
  // fourni.
  getRowId?: (row: T) => string
  selectedRowId?: string | null
  // Simple clic : sélectionne la ligne (surbrillance, active le bouton
  // Supprimer) sans rien ouvrir.
  onRowClick?: (row: T) => void
  // Double clic : ouvre la modale de modification (voir <Entite>Page.tsx
  // sous src/features/) — un simple clic ne l'ouvre plus, pour laisser le
  // simple clic sélectionner la ligne sans interrompre la lecture du
  // tableau.
  onRowDoubleClick?: (row: T) => void
  // Nom du fichier généré par le bouton Exporter (sans l'extension .xlsx)
  // — voir CrudPage.tsx, qui y passe le titre de la page.
  exportFileName?: string
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
export function DataTable<T extends RowData>({ data, columns, getRowId, selectedRowId, onRowClick, onRowDoubleClick, exportFileName, expandedRowId, renderExpandedRow }: Props<T>) {
  // Id de la colonne dont le champ de filtre est actuellement ouvert
  // (une seule à la fois), ou null si aucune.
  const [openFilterId, setOpenFilterId] = useState<string | null>(null)

  const table = useTable({ features, columns, data })

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
        <button type="button" className="data-table-export-button" onClick={handleExportExcel}>
          <ExcelIcon />
          Exporter
        </button>
      </div>
      <table>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
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
            const isSelected = id !== undefined && id === selectedRowId
            const isClickable = Boolean(onRowClick || onRowDoubleClick)
            const cells = row.getAllCells()
            const isExpanded = id !== undefined && id === expandedRowId
            return (
              <Fragment key={row.id}>
                <tr
                  className={`data-table-row${isClickable ? ' clickable' : ''}${isSelected ? ' selected' : ''}`}
                  onClick={() => onRowClick?.(row.original)}
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                >
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
                    <td colSpan={cells.length}>{renderExpandedRow()}</td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
