import { useEffect, useRef, useState, type DragEvent, type MouseEvent } from 'react'
import { MergeFieldPalette } from './MergeFieldPalette.js'
import { EditorToolbar } from './EditorToolbar.js'
import { findFieldByPath, findGroupById, type MergeField, type MergeFieldGroup } from './mergeFields.js'
import { DRAG_MIME, createChipElement, createRepeatBlockElement, insertBlockNode, insertInlineNodeAtRange, rangeFromPoint, type DragPayload } from './domInsert.js'
import './DocumentTemplateEditor.css'
import { useLeaveGuard } from '../../components/unsaved-changes/UnsavedChangesContext.js'

export type TemplateZoneHtml = { headerHtml: string; contentHtml: string; footerHtml: string }

type ZoneKey = 'header' | 'content' | 'footer'

const ZONES: { key: ZoneKey; label: string; hint: string }[] = [
  { key: 'header', label: 'En-tête', hint: 'répété en haut de chaque page' },
  { key: 'content', label: 'Contenu', hint: '' },
  { key: 'footer', label: 'Pied de page', hint: 'répété en bas de chaque page' },
]

type Props = {
  initial: TemplateZoneHtml
  onSave: (html: TemplateZoneHtml) => void
  onCancel: () => void
  saving?: boolean
}

// Éditeur d'un modèle de document : trois zones contentEditable côte à côte
// dans une même page A4 (voir ZONES) — en-tête et pied de page, répétés sur
// chaque page à l'impression (voir backend/src/document-merge/pdf-renderer.service.ts,
// headerTemplate/footerTemplate), et le contenu principal, affiché une fois.
// Chaque zone glisse-dépose ses propres champs de fusion (voir
// MergeFieldPalette.tsx) et blocs répétables liés aux listes du contrat
// (Prestations...) — la palette et la barre d'outils agissent sur la
// « zone active » (dernière zone où le curseur se trouvait, voir l'effet
// selectionchange plus bas), pas nécessairement celle qui a le focus DOM au
// moment du clic (les boutons de la palette/barre d'outils le lui font
// perdre). Le contenu de chaque zone est manipulé directement en DOM (pas
// piloté par du state React à chaque frappe) pour ne pas perdre la position
// du curseur à chaque rendu — voir domInsert.ts.
export function DocumentTemplateEditor({ initial, onSave, onCancel, saving }: Props) {
  const canvasRefs = useRef<Record<ZoneKey, HTMLDivElement | null>>({ header: null, content: null, footer: null })
  const lastRangeRefs = useRef<Record<ZoneKey, Range | null>>({ header: null, content: null, footer: null })
  const [activeZone, setActiveZone] = useState<ZoneKey>('content')
  const [dirty, setDirty] = useState(false)
  // Zone actuellement éditée en code HTML brut plutôt qu'en visuel (bouton
  // </> de la barre d'outils, voir toggleCodeView) — une seule à la fois.
  // Tant qu'elle est active, le canvas contentEditable correspondant est
  // masqué (voir le rendu plus bas) et `codeHtml` fait foi pour cette zone :
  // le canvas n'est réécrit qu'au moment de sortir du mode code (voir
  // flushCodeZone), pas à chaque frappe dans le textarea.
  const [codeZone, setCodeZone] = useState<ZoneKey | null>(null)
  const [codeHtml, setCodeHtml] = useState('')
  const codeTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Contenu initial posé une seule fois : au-delà, c'est le DOM lui-même qui
  // fait foi (voir handleSave). Si le modèle change (nouvel id), le parent
  // doit remonter ce composant avec une `key` différente plutôt que de
  // changer `initial` en place.
  useEffect(() => {
    if (canvasRefs.current.header) canvasRefs.current.header.innerHTML = initial.headerHtml
    if (canvasRefs.current.content) canvasRefs.current.content.innerHTML = initial.contentHtml
    if (canvasRefs.current.footer) canvasRefs.current.footer.innerHTML = initial.footerHtml
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mémorise la dernière position du curseur dans chaque zone, pour que les
  // boutons « + » de la palette (sans souris sur le canvas) sachent où
  // insérer un champ — et détecte au passage dans quelle zone il se trouve,
  // pour y faire porter les actions de la palette/barre d'outils.
  useEffect(() => {
    function onSelectionChange() {
      const selection = document.getSelection()
      if (!selection || selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      for (const { key } of ZONES) {
        const canvas = canvasRefs.current[key]
        if (canvas && canvas.contains(range.commonAncestorContainer)) {
          lastRangeRefs.current[key] = range.cloneRange()
          setActiveZone(key)
          break
        }
      }
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  function markDirty() {
    setDirty(true)
  }

  // Réécrit le canvas de la zone en cours d'édition « code » avec le contenu
  // du textarea, puis sort du mode code — sans effet si aucune zone n'y est
  // (voir handleSave/handleReset, qui l'appellent avant de lire les canvas).
  function flushCodeZone() {
    if (!codeZone) return
    const canvas = canvasRefs.current[codeZone]
    if (canvas) canvas.innerHTML = codeHtml
    setCodeZone(null)
  }

  function toggleCodeView() {
    if (codeZone === activeZone) {
      flushCodeZone()
      markDirty()
      return
    }
    // Une autre zone était en mode code : la refermer d'abord (son propre
    // textarea ne serait sinon plus affiché ni modifiable une fois qu'on
    // aurait quitté cette zone).
    flushCodeZone()
    setCodeHtml(canvasRefs.current[activeZone]?.innerHTML ?? '')
    setCodeZone(activeZone)
  }

  function currentRange(zone: ZoneKey): Range {
    const canvas = canvasRefs.current[zone]!
    const stored = lastRangeRefs.current[zone]
    if (stored && canvas.contains(stored.commonAncestorContainer)) return stored
    const range = document.createRange()
    range.selectNodeContents(canvas)
    range.collapse(false)
    return range
  }

  function exec(command: string, value?: string) {
    const canvas = canvasRefs.current[activeZone]
    canvas?.focus()
    document.execCommand(command, false, value)
    markDirty()
  }

  // Insère du HTML dans le textarea de code source de la zone active, à la
  // position du curseur (voir handleCodeDrop pour le glisser-déposer, qui
  // partage cette logique) — utilisé par insertField/insertGroup quand la
  // palette est utilisée pendant que cette zone est en mode code, pour ne pas
  // écrire silencieusement dans le canvas caché (qui serait de toute façon
  // écrasé par le contenu du textarea à la sortie du mode code, voir
  // flushCodeZone).
  function insertHtmlIntoCode(html: string) {
    const textarea = codeTextareaRef.current
    const start = textarea?.selectionStart ?? codeHtml.length
    const end = textarea?.selectionEnd ?? codeHtml.length
    setCodeHtml(codeHtml.slice(0, start) + html + codeHtml.slice(end))
    markDirty()
    const caret = start + html.length
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(caret, caret)
    })
  }

  function insertField(field: MergeField) {
    if (activeZone === codeZone) {
      insertHtmlIntoCode(createChipElement(field).outerHTML)
      return
    }
    const canvas = canvasRefs.current[activeZone]
    if (!canvas) return
    canvas.focus()
    insertInlineNodeAtRange(createChipElement(field), currentRange(activeZone))
    markDirty()
  }

  function insertGroup(group: MergeFieldGroup) {
    const node = createRepeatBlockElement(group)
    if (!node) return
    if (activeZone === codeZone) {
      insertHtmlIntoCode(node.outerHTML)
      return
    }
    const canvas = canvasRefs.current[activeZone]
    if (!canvas) return
    canvas.focus()
    insertBlockNode(canvas, node)
    markDirty()
  }

  function insertRepeatGroupById(groupId: string) {
    const group = findGroupById(groupId)
    if (group) insertGroup(group)
  }

  function insertFreeTable() {
    const canvas = canvasRefs.current[activeZone]
    if (!canvas) return
    const table = document.createElement('table')
    table.className = 'dte-table dte-table-free'
    const tbody = document.createElement('tbody')
    for (let row = 0; row < 2; row++) {
      const tr = document.createElement('tr')
      for (let col = 0; col < 2; col++) {
        const td = document.createElement('td')
        td.innerHTML = '<br>'
        tr.append(td)
      }
      tbody.append(tr)
    }
    table.append(tbody)
    insertBlockNode(canvas, table)
    markDirty()
  }

  function insertPageBreak() {
    const canvas = canvasRefs.current[activeZone]
    if (!canvas) return
    const marker = document.createElement('div')
    marker.className = 'dte-page-break'
    marker.contentEditable = 'false'
    marker.innerHTML = '<span>Saut de page</span>'
    insertBlockNode(canvas, marker)
    markDirty()
  }

  // Numéro de page (en-tête/pied uniquement) : pas un champ de fusion — un
  // texte littéral que Puppeteer remplit lui-même à l'impression (classes
  // spéciales .pageNumber/.totalPages, voir pdf-renderer.service.ts). Inséré
  // comme un bloc non éditable, au même titre qu'un jeton, pour ne pas être
  // modifié par erreur.
  function insertPageNumber() {
    const canvas = canvasRefs.current[activeZone]
    if (!canvas) return
    const node = document.createElement('span')
    node.className = 'dte-chip dte-chip-pagenum'
    node.contentEditable = 'false'
    node.innerHTML = 'Page <span class="pageNumber"></span> / <span class="totalPages"></span>'
    canvas.focus()
    insertInlineNodeAtRange(node, currentRange(activeZone))
    markDirty()
  }

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(zone: ZoneKey) {
    return (e: DragEvent) => {
      const raw = e.dataTransfer.getData(DRAG_MIME)
      if (!raw) return
      e.preventDefault()
      const canvas = canvasRefs.current[zone]
      if (!canvas) return
      setActiveZone(zone)

      let payload: DragPayload
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }

      // Un groupe (liste) se dépose toujours comme un bloc de premier niveau
      // (voir insertBlockNode) : un <div>/<table> inséré au milieu d'un
      // paragraphe produirait du HTML imbriqué invalide.
      if (payload.type === 'group') {
        const group = findGroupById(payload.groupId)
        const node = group ? createRepeatBlockElement(group) : null
        if (node) insertBlockNode(canvas, node, { x: e.clientX, y: e.clientY })
        markDirty()
        return
      }

      // Un champ simple se dépose au fil du texte, à la position exacte du
      // pointeur.
      const field = findFieldByPath(payload.path)
      const range = rangeFromPoint(e.clientX, e.clientY)
      if (!field || !range) return
      canvas.focus()
      insertInlineNodeAtRange(createChipElement(field), range)
      markDirty()
    }
  }

  // Glisser-déposer depuis la palette pendant l'édition du code HTML brut
  // (voir codeZone) : pas d'équivalent de rangeFromPoint pour un <textarea>
  // (son contenu n'est pas du DOM adressable par point), donc insertion à la
  // position du curseur — comme les boutons « + » de la palette pour le
  // canvas visuel (voir currentRange) — plutôt qu'au pixel exact du dépose.
  function handleCodeDrop(e: DragEvent<HTMLTextAreaElement>) {
    const raw = e.dataTransfer.getData(DRAG_MIME)
    if (!raw) return
    e.preventDefault()

    let payload: DragPayload
    try {
      payload = JSON.parse(raw)
    } catch {
      return
    }

    if (payload.type === 'group') {
      const group = findGroupById(payload.groupId)
      const node = group ? createRepeatBlockElement(group) : null
      if (node) insertHtmlIntoCode(node.outerHTML)
      return
    }

    const field = findFieldByPath(payload.path)
    if (field) insertHtmlIntoCode(createChipElement(field).outerHTML)
  }

  // Suppression d'un jeton/bloc : délégation sur le canvas plutôt qu'un
  // handler par élément inséré en DOM impératif (React n'a pas la main sur
  // ces nœuds) — la même logique s'applique quelle que soit la zone.
  function handleCanvasClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const chipRemove = target.closest('[data-chip-remove]')
    if (chipRemove) {
      chipRemove.closest('.dte-chip')?.remove()
      markDirty()
      return
    }
    const repeatRemove = target.closest('[data-repeat-remove]')
    if (repeatRemove) {
      const block = repeatRemove.closest('.dte-repeat')
      const label = block?.getAttribute('data-repeat-label') ?? 'ce bloc'
      if (block && window.confirm(`Supprimer le bloc répétable « ${label} » ?`)) {
        block.remove()
        markDirty()
      }
    }
  }

  function handleSave() {
    flushCodeZone()
    const content = canvasRefs.current.content
    if (!content) return
    onSave({
      headerHtml: canvasRefs.current.header?.innerHTML ?? '',
      contentHtml: content.innerHTML,
      footerHtml: canvasRefs.current.footer?.innerHTML ?? '',
    })
    setDirty(false)
  }

  // Quitter l'éditeur modifié (Fermer, retour à la liste, fermeture de
  // l'onglet) demande « Enregistrer / Annuler les modifications ».
  const confirmLeave = useLeaveGuard({ isDirty: () => dirty, save: handleSave })

  function handleReset() {
    if (!window.confirm('Réinitialiser le modèle avec la mise en page de départ ? Les modifications non enregistrées seront perdues.')) return
    setCodeZone(null)
    if (canvasRefs.current.header) canvasRefs.current.header.innerHTML = initial.headerHtml
    if (canvasRefs.current.content) canvasRefs.current.content.innerHTML = initial.contentHtml
    if (canvasRefs.current.footer) canvasRefs.current.footer.innerHTML = initial.footerHtml
    markDirty()
  }

  return (
    <div className="dte">
      <EditorToolbar
        onCommand={exec}
        onInsertFreeTable={insertFreeTable}
        onInsertPageBreak={insertPageBreak}
        onInsertRepeatGroup={insertRepeatGroupById}
        onInsertPageNumber={activeZone === 'content' ? undefined : insertPageNumber}
        onToggleCodeView={toggleCodeView}
        codeViewActive={codeZone === activeZone}
      />
      <div className="dte-body">
        <MergeFieldPalette onInsertField={insertField} onInsertGroup={insertGroup} />
        <div className="dte-canvas-scroll">
          <div className="dte-page">
            {ZONES.map(({ key, label, hint }) => (
              <div key={key} className={`dte-zone dte-zone-${key}${activeZone === key ? ' active' : ''}`}>
                {hint && (
                  <div className="dte-zone-label">
                    {label} <span>— {hint}</span>
                  </div>
                )}
                <div
                  ref={(el) => {
                    canvasRefs.current[key] = el
                  }}
                  className={`dte-zone-canvas dte-zone-canvas-${key}`}
                  // Masqué plutôt que démonté en mode code (voir codeZone) :
                  // la ref doit rester valide pour que flushCodeZone puisse y
                  // réécrire le HTML édité en sortant du mode code.
                  hidden={codeZone === key}
                  contentEditable
                  suppressContentEditableWarning
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(key)}
                  onClick={handleCanvasClick}
                  onInput={markDirty}
                  // Filet de sécurité pour selectionchange : un clic dans une
                  // zone quasi vide déplace le focus DOM sans forcément
                  // replacer le curseur de texte dedans (la sélection ne
                  // bouge alors pas) — le focus, lui, est toujours fiable.
                  onFocus={() => setActiveZone(key)}
                />
                {codeZone === key && (
                  <textarea
                    ref={codeTextareaRef}
                    className="dte-zone-code"
                    value={codeHtml}
                    onChange={(e) => {
                      setCodeHtml(e.target.value)
                      markDirty()
                    }}
                    onFocus={() => setActiveZone(key)}
                    onDragOver={handleDragOver}
                    onDrop={handleCodeDrop}
                    spellCheck={false}
                    aria-label={`Code HTML — ${label}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="dte-actions">
        <span className="dte-dirty-hint">{dirty ? 'Modifications non enregistrées' : 'Tout est enregistré'}</span>
        <button type="button" className="btn" onClick={handleReset}>Réinitialiser</button>
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Fermer</button>
        <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
