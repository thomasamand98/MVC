import { useMemo, useState, type DragEvent } from 'react'
import { MERGE_FIELD_GROUPS, type MergeField, type MergeFieldGroup } from './mergeFields.js'
import { DRAG_MIME, type DragPayload } from './domInsert.js'
import { GripIcon, PlusIcon, RepeatIcon, SearchIcon } from './icons.js'

type Props = {
  onInsertField: (field: MergeField) => void
  onInsertGroup: (group: MergeFieldGroup) => void
}

function startDrag(e: DragEvent, payload: DragPayload) {
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
  e.dataTransfer.setData('text/plain', payload.type === 'field' ? `{{${payload.path}}}` : `{{#${payload.groupId}}}`)
  e.dataTransfer.effectAllowed = 'copy'
}

// Un champ simple de la palette : glisser dépose un jeton de fusion dans le
// texte au point de dépose ; le bouton « + » l'insère à la position du
// curseur (ou en fin de document), pour rester utilisable sans souris.
function FieldRow({ field, onInsert }: { field: MergeField; onInsert: (field: MergeField) => void }) {
  return (
    <div
      className="dte-palette-field"
      draggable
      onDragStart={(e) => startDrag(e, { type: 'field', path: field.path })}
    >
      <GripIcon />
      <span className="dte-palette-field-label">{field.label}</span>
      <button type="button" className="dte-palette-insert" onClick={() => onInsert(field)} aria-label={`Insérer ${field.label}`}>
        <PlusIcon />
      </button>
    </div>
  )
}

function GroupSection({ group, onInsertField, onInsertGroup, defaultOpen }: Props & { group: MergeFieldGroup; defaultOpen: boolean }) {
  return (
    <details className="dte-palette-group" open={defaultOpen}>
      <summary
        className="dte-palette-group-summary"
        draggable={!!group.listPath}
        onDragStart={group.listPath ? (e) => startDrag(e, { type: 'group', groupId: group.id }) : undefined}
      >
        {group.listPath ? <RepeatIcon /> : null}
        <span>{group.label}</span>
        {group.listPath ? (
          <button
            type="button"
            className="dte-palette-insert"
            onClick={(e) => {
              e.preventDefault()
              onInsertGroup(group)
            }}
            aria-label={`Insérer le tableau ${group.label}`}
          >
            <PlusIcon />
          </button>
        ) : null}
      </summary>
      {group.listPath ? <p className="dte-palette-hint">Glisser insère un tableau répétable (une ligne par élément à la fusion).</p> : null}
      <div className="dte-palette-fields">
        {group.fields.map((field) => (
          <FieldRow key={field.path} field={field} onInsert={onInsertField} />
        ))}
      </div>
      {group.children?.map((child) => (
        <GroupSection key={child.id} group={child} onInsertField={onInsertField} onInsertGroup={onInsertGroup} defaultOpen={false} />
      ))}
    </details>
  )
}

// Résultat de recherche : liste plate de champs correspondant au filtre,
// avec le libellé de leur groupe pour se repérer.
function SearchResults({ query, onInsertField }: { query: string; onInsertField: (field: MergeField) => void }) {
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    function collect(groups: MergeFieldGroup[]): { group: MergeFieldGroup; field: MergeField }[] {
      return groups.flatMap((group) => [
        ...group.fields.filter((f) => f.label.toLowerCase().includes(needle) || f.path.toLowerCase().includes(needle)).map((field) => ({ group, field })),
        ...(group.children ? collect(group.children) : []),
      ])
    }
    return collect(MERGE_FIELD_GROUPS)
  }, [query])

  if (results.length === 0) {
    return <p className="dte-palette-hint">Aucun champ ne correspond à « {query} ».</p>
  }

  return (
    <div className="dte-palette-fields">
      {results.map(({ group, field }) => (
        <div key={field.path} className="dte-palette-field" draggable onDragStart={(e) => startDrag(e, { type: 'field', path: field.path })}>
          <GripIcon />
          <span className="dte-palette-field-label">
            {field.label}
            <span className="dte-palette-field-group"> — {group.label}</span>
          </span>
          <button type="button" className="dte-palette-insert" onClick={() => onInsertField(field)} aria-label={`Insérer ${field.label}`}>
            <PlusIcon />
          </button>
        </div>
      ))}
    </div>
  )
}

// Panneau latéral de champs de fusion : glisser-déposer dans le canvas, ou
// bouton « + » pour insérer sans souris. Les groupes sans `listPath` sont
// des champs simples (un seul jeton) ; ceux avec `listPath` représentent une
// collection (Prestations...) et se déposent comme un tableau répétable.
export function MergeFieldPalette({ onInsertField, onInsertGroup }: Props) {
  const [query, setQuery] = useState('')

  return (
    <aside className="dte-palette">
      <div className="dte-palette-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Rechercher un champ…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {query.trim() ? (
        <SearchResults query={query} onInsertField={onInsertField} />
      ) : (
        <div className="dte-palette-groups">
          {MERGE_FIELD_GROUPS.map((group, index) => (
            <GroupSection key={group.id} group={group} onInsertField={onInsertField} onInsertGroup={onInsertGroup} defaultOpen={index < 2} />
          ))}
        </div>
      )}
    </aside>
  )
}
