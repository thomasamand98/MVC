import { listGroups } from './mergeFields.js'
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  ListIcon,
  PageBreakIcon,
  PageNumberIcon,
  RedoIcon,
  TableIcon,
  UnderlineIcon,
  UndoIcon,
} from './icons.js'

type Props = {
  onCommand: (command: string, value?: string) => void
  onInsertFreeTable: () => void
  onInsertPageBreak: () => void
  onInsertRepeatGroup: (groupId: string) => void
  // Numéro de page : uniquement pertinent en en-tête/pied (répétés sur
  // chaque page) — absent (undefined) tant que la zone active est le
  // contenu, pour ne pas laisser insérer un jeton qui n'y sera jamais rempli
  // (voir DocumentTemplateEditor.tsx).
  onInsertPageNumber?: () => void
  // Bascule la zone active entre édition visuelle et code source HTML brut
  // (voir DocumentTemplateEditor.tsx, codeZone). Les autres outils sont
  // désactivés en mode code : ils agissent sur le canvas contentEditable,
  // masqué tant que son code source est en cours d'édition.
  onToggleCodeView: () => void
  codeViewActive: boolean
}

// Barre d'outils de mise en forme : s'appuie sur document.execCommand, une
// API dépréciée mais toujours largement supportée, plutôt que d'ajouter une
// dépendance d'édition riche (tiptap, slate...) pour ce prototype interne —
// à réévaluer si l'éditeur doit gagner en richesse plus tard.
export function EditorToolbar({
  onCommand,
  onInsertFreeTable,
  onInsertPageBreak,
  onInsertRepeatGroup,
  onInsertPageNumber,
  onToggleCodeView,
  codeViewActive,
}: Props) {
  const repeatableGroups = listGroups()

  return (
    <div className="dte-toolbar" role="toolbar" aria-label="Mise en forme du modèle">
      <fieldset className="dte-toolbar-fieldset" disabled={codeViewActive}>
        <select className="dte-toolbar-select" defaultValue="" onChange={(e) => { onCommand('formatBlock', e.target.value); e.target.value = '' }}>
          <option value="" disabled>Style…</option>
          <option value="P">Paragraphe</option>
          <option value="H2">Titre</option>
          <option value="H3">Sous-titre</option>
        </select>

        <div className="dte-toolbar-group">
          <button type="button" title="Gras" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('bold')}><BoldIcon /></button>
          <button type="button" title="Italique" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('italic')}><ItalicIcon /></button>
          <button type="button" title="Souligné" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('underline')}><UnderlineIcon /></button>
        </div>

        <div className="dte-toolbar-group">
          <button type="button" title="Aligner à gauche" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('justifyLeft')}><AlignLeftIcon /></button>
          <button type="button" title="Centrer" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('justifyCenter')}><AlignCenterIcon /></button>
          <button type="button" title="Aligner à droite" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('justifyRight')}><AlignRightIcon /></button>
        </div>

        <div className="dte-toolbar-group">
          <button type="button" title="Liste à puces" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('insertUnorderedList')}><ListIcon /></button>
          <button type="button" title="Tableau libre" onMouseDown={(e) => e.preventDefault()} onClick={onInsertFreeTable}><TableIcon /></button>
          <button type="button" title="Saut de page" onMouseDown={(e) => e.preventDefault()} onClick={onInsertPageBreak}><PageBreakIcon /></button>
          {onInsertPageNumber && (
            <button type="button" title="Numéro de page" onMouseDown={(e) => e.preventDefault()} onClick={onInsertPageNumber}><PageNumberIcon /></button>
          )}
        </div>

        <select
          className="dte-toolbar-select"
          defaultValue=""
          title="Insérer un bloc répétable"
          onChange={(e) => {
            if (e.target.value) onInsertRepeatGroup(e.target.value)
            e.target.value = ''
          }}
        >
          <option value="" disabled>↻ Bloc répétable…</option>
          {repeatableGroups.map((group) => (
            <option key={group.id} value={group.id}>{group.label}</option>
          ))}
        </select>

        <div className="dte-toolbar-group">
          <button type="button" title="Annuler" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('undo')}><UndoIcon /></button>
          <button type="button" title="Rétablir" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand('redo')}><RedoIcon /></button>
        </div>
      </fieldset>

      <div className="dte-toolbar-group dte-toolbar-group-end">
        <button
          type="button"
          title="Voir/éditer le code HTML"
          aria-pressed={codeViewActive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleCodeView}
        >
          <CodeIcon />
        </button>
      </div>
    </div>
  )
}
