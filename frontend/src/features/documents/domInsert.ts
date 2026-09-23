import type { MergeField, MergeFieldGroup } from './mergeFields.js'

// Manipulation directe du DOM du canvas (plutôt que de recalculer le HTML
// via React à chaque frappe) : le canvas est un <div contentEditable>
// classique — c'est le seul moyen d'y insérer un nœud sans faire sauter le
// curseur/la sélection de l'utilisateur à chaque rendu React. Voir
// DocumentTemplateEditor.tsx.

export type DragPayload = { type: 'field'; path: string } | { type: 'group'; groupId: string }

export const DRAG_MIME = 'application/x-merge-field'

// Jeton de fusion inséré dans le texte : un <span> non éditable portant le
// chemin du champ, avec une croix de suppression. `data-merge-field` est le
// contrat repris par le futur moteur de fusion pour retrouver la valeur.
//
// kind="image" (ex. Entite.Logo) : rendu comme une vignette image plutôt
// qu'une pastille de texte (voir DocumentTemplateEditor.css,
// .dte-chip-image) — l'éditeur ne connaît pas le logo réel, seule sa
// vignette générique est affichée ; la vraie image n'est résolue que côté
// backend, à la génération du PDF (voir merge-html.ts).
export function createChipElement(field: MergeField): HTMLSpanElement {
  const chip = document.createElement('span')
  chip.className = field.kind === 'image' ? 'dte-chip dte-chip-image' : 'dte-chip'
  chip.contentEditable = 'false'
  chip.setAttribute('data-merge-field', field.path)
  chip.setAttribute('data-kind', field.kind)

  if (field.kind === 'image') {
    const icon = document.createElement('span')
    icon.className = 'dte-chip-image-icon'
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = '🖼'
    chip.append(icon)
  }

  const label = document.createElement('span')
  label.className = 'dte-chip-label'
  label.textContent = field.label
  chip.append(label)

  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'dte-chip-remove'
  remove.setAttribute('data-chip-remove', '')
  remove.setAttribute('aria-label', `Retirer le champ ${field.label}`)
  remove.textContent = '×'
  chip.append(remove)

  return chip
}

// Bloc répétable (tableau) : une ligne d'en-tête + une ligne « modèle »
// contenant un jeton par colonne. `data-repeat-list` porte le chemin de la
// collection — au moment de la fusion, la ligne modèle sera dupliquée une
// fois par élément de la liste.
export function createRepeatBlockElement(group: MergeFieldGroup, columnPaths?: string[]): HTMLDivElement | null {
  if (!group.listPath) return null
  const paths = columnPaths ?? group.defaultColumns ?? group.fields.slice(0, 4).map((f) => f.path)
  const columns = paths.map((path) => group.fields.find((f) => f.path === path)).filter((f): f is MergeField => !!f)
  if (columns.length === 0) return null

  const wrapper = document.createElement('div')
  wrapper.className = 'dte-repeat'
  wrapper.setAttribute('data-repeat-list', group.listPath)
  wrapper.setAttribute('data-repeat-label', group.label)

  const tag = document.createElement('div')
  tag.className = 'dte-repeat-tag'
  tag.contentEditable = 'false'
  const tagLabel = document.createElement('span')
  tagLabel.textContent = `↻ Répété pour chaque « ${group.label} »`
  tag.append(tagLabel)
  const tagRemove = document.createElement('button')
  tagRemove.type = 'button'
  tagRemove.className = 'dte-repeat-remove'
  tagRemove.setAttribute('data-repeat-remove', '')
  tagRemove.setAttribute('aria-label', `Supprimer le bloc « ${group.label} »`)
  tagRemove.textContent = '× Supprimer le bloc'
  tag.append(tagRemove)

  const table = document.createElement('table')
  table.className = 'dte-table'

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  for (const field of columns) {
    const th = document.createElement('th')
    th.textContent = field.label
    headRow.append(th)
  }
  thead.append(headRow)

  const tbody = document.createElement('tbody')
  const bodyRow = document.createElement('tr')
  bodyRow.className = 'dte-repeat-row'
  for (const field of columns) {
    const td = document.createElement('td')
    td.append(createChipElement(field))
    bodyRow.append(td)
  }
  tbody.append(bodyRow)

  table.append(thead, tbody)
  wrapper.append(tag, table)
  return wrapper
}

// Position de dépose dans le texte (insertion « en ligne », pour un jeton
// simple) : caretRangeFromPoint (Chrome/Safari) puis repli sur
// caretPositionFromPoint (Firefox), toutes deux non standard à des degrés
// divers mais couvrant les navigateurs de bureau visés par cet outil interne.
export function rangeFromPoint(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  if (typeof doc.caretRangeFromPoint === 'function') {
    return doc.caretRangeFromPoint(x, y)
  }
  if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(x, y)
    if (!pos) return null
    const range = document.createRange()
    range.setStart(pos.offsetNode, pos.offset)
    range.collapse(true)
    return range
  }
  return null
}

// Un Range obtenu par point (voir rangeFromPoint) peut tomber au milieu du
// texte d'un jeton existant (les chips restent des nœuds texte pour le
// calcul de position, contentEditable="false" empêche seulement l'édition,
// pas le pointage) : y insérer directement casserait le chip en deux
// morceaux imbriqués l'un dans l'autre. On ramène alors le point
// d'insertion juste après ce chip.
function escapeChipRange(range: Range): Range {
  const container = range.startContainer
  const el = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element | null)
  const chip = el?.closest('.dte-chip')
  if (!chip || !chip.parentNode) return range
  const escaped = document.createRange()
  escaped.setStartAfter(chip)
  escaped.collapse(true)
  return escaped
}

// Insère un nœud « en ligne » (jeton de fusion) à l'endroit précis d'un
// Range, puis replace le curseur juste après.
export function insertInlineNodeAtRange(node: Node, inputRange: Range) {
  const range = escapeChipRange(inputRange)
  range.deleteContents()
  range.insertNode(node)
  const after = document.createRange()
  after.setStartAfter(node)
  after.collapse(true)
  const selection = document.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(after)
}

// Insère un nœud « bloc » (tableau répétable, tableau libre, saut de page) :
// toujours en enfant direct du canvas, jamais au milieu d'un paragraphe —
// une <div>/<table> insérée via un Range arbitraire produirait du HTML
// imbriqué invalide (bloc dans un <p>) que le navigateur "corrige" de façon
// imprévisible. Si `nearPoint` est fourni, le bloc est inséré juste après
// le bloc de premier niveau situé sous ce point ; sinon il est ajouté à la
// fin du document.
export function insertBlockNode(canvas: HTMLElement, node: Node, nearPoint?: { x: number; y: number }) {
  let anchor: Element | null = null
  if (nearPoint) {
    const el = document.elementFromPoint(nearPoint.x, nearPoint.y)
    let candidate = el instanceof Element ? el : null
    while (candidate && candidate.parentElement !== canvas) {
      candidate = candidate.parentElement
    }
    anchor = candidate && candidate.parentElement === canvas ? candidate : null
  }
  if (anchor) {
    anchor.after(node)
  } else {
    canvas.append(node)
  }
}
