import { useState } from 'react'
import { useDocumentTemplates } from './useDocumentTemplates.js'
import { DocumentTemplateEditor, type TemplateZoneHtml } from './DocumentTemplateEditor.js'
import { Modal } from '../../components/Modal.js'
import { CopyIcon, DocumentIcon, PlusIcon, TrashIcon } from './icons.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { STARTER_CONTENT_HTML, STARTER_FOOTER_HTML, STARTER_HEADER_HTML } from './starterTemplate.js'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type DocumentTemplateDetail, type DocumentTemplateDto, type DocumentType } from './types.js'
import './DocumentTemplatesPage.css'
import { useConfirmLeave, useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('fr-BE', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

// Page "Modèles de documents" (groupe Gestion documentaire) : liste de tous
// les modèles créés (tous types confondus — voir DOCUMENT_TYPES), et éditeur
// (DocumentTemplateEditor.tsx) pour glisser-déposer les champs de fusion
// dedans, en-tête/contenu/pied de page. La fiche contrat, elle, ne charge que
// les modèles de type "CONTRAT" pour son bouton « Voir le PDF » (voir
// ContratPdfButton.tsx) — d'où le filtre par type choisi ici à la création,
// pas à l'affichage de cette liste.
export function DocumentTemplatesPage() {
  const { templates, setTemplates, loading, error } = useDocumentTemplates()
  const { get, create, update, remove } = useApiMutation<DocumentTemplateDto, DocumentTemplateDetail>('document-templates')
  // Fiche complète (avec le HTML des trois zones, absent de la liste) du
  // modèle ouvert dans l'éditeur — chargée à la demande (voir handleOpen).
  const [open, setOpen] = useState<DocumentTemplateDetail | null>(null)
  const [opening, setOpening] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  // Modale de création : demande le type de modèle avant tout (voir la
  // demande initiale — un modèle de facture n'a pas la même mise en page
  // qu'un modèle de contrat).
  const [creating, setCreating] = useState(false)
  // Retour à la liste depuis l'éditeur : l'onglet contient l'éditeur, sa
  // zone suffit à vérifier une saisie en cours.
  const confirmLeave = useConfirmLeave()

  function openCreateModal() {
    setCreating(true)
  }

  async function handleCreate(nom: string, type: DocumentType) {
    const created = await create({
      Nom: nom.trim() || 'Nouveau modèle',
      Type_document: type,
      Description: '',
      Contenu_entete: STARTER_HEADER_HTML,
      Contenu_html: STARTER_CONTENT_HTML,
      Contenu_pied: STARTER_FOOTER_HTML,
    })
    setTemplates((prev) => [...prev, created])
    setCreating(false)
    setNameDraft(created.Nom)
    setOpen(created)
  }

  async function handleOpen(id: string) {
    setOpening(true)
    try {
      const detail = await get(id)
      setNameDraft(detail.Nom)
      setOpen(detail)
    } finally {
      setOpening(false)
    }
  }

  async function handleDelete(id: string) {
    const template = templates.find((t) => t.IDDOCUMENT_TEMPLATES === id)
    if (!template) return
    if (!window.confirm(`Supprimer le modèle « ${template.Nom} » ?`)) return
    await remove(id)
    setTemplates((prev) => prev.filter((t) => t.IDDOCUMENT_TEMPLATES !== id))
    if (open?.IDDOCUMENT_TEMPLATES === id) setOpen(null)
  }

  // Pas d'endpoint dédié : charge la fiche complète et recrée un modèle à
  // partir de son contenu (les trois zones, même type).
  async function handleDuplicate(id: string) {
    const detail = await get(id)
    const copy = await create({
      Nom: `${detail.Nom} (copie)`,
      Type_document: detail.Type_document as DocumentType,
      Description: detail.Description ?? '',
      Contenu_entete: detail.Contenu_entete ?? '',
      Contenu_html: detail.Contenu_html,
      Contenu_pied: detail.Contenu_pied ?? '',
    })
    setTemplates((prev) => [...prev, copy])
  }

  async function handleRename() {
    if (!open) return
    const updated = await update(open.IDDOCUMENT_TEMPLATES, { Nom: nameDraft || open.Nom })
    setTemplates((prev) => prev.map((t) => (t.IDDOCUMENT_TEMPLATES === updated.IDDOCUMENT_TEMPLATES ? updated : t)))
    setOpen(updated)
  }

  async function handleSave({ headerHtml, contentHtml, footerHtml }: TemplateZoneHtml) {
    if (!open) return
    const updated = await update(open.IDDOCUMENT_TEMPLATES, {
      Nom: nameDraft || open.Nom,
      Contenu_entete: headerHtml,
      Contenu_html: contentHtml,
      Contenu_pied: footerHtml,
    })
    setTemplates((prev) => prev.map((t) => (t.IDDOCUMENT_TEMPLATES === updated.IDDOCUMENT_TEMPLATES ? updated : t)))
    setOpen(updated)
  }

  if (opening) return <p>Chargement du modèle...</p>

  if (open) {
    return (
      <div className="dtp-editor-page">
        <div className="page-header">
          <div className="dtp-editor-title">
            <button type="button" className="btn" onClick={async () => { if (await confirmLeave()) setOpen(null) }}>&larr; Modèles</button>
            <input
              className="dtp-name-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleRename}
              placeholder="Nom du modèle"
            />
            <span className="dtp-type-badge">{DOCUMENT_TYPE_LABELS[open.Type_document as DocumentType] ?? open.Type_document}</span>
          </div>
        </div>
        <DocumentTemplateEditor
          key={open.IDDOCUMENT_TEMPLATES}
          initial={{ headerHtml: open.Contenu_entete ?? '', contentHtml: open.Contenu_html, footerHtml: open.Contenu_pied ?? '' }}
          onSave={handleSave}
          onCancel={() => setOpen(null)}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Modèles de documents</h2>
        <div className="page-actions">
          <button type="button" className="btn primary" onClick={openCreateModal}>
            <PlusIcon />
            Nouveau modèle
          </button>
        </div>
      </div>

      {loading && <p>Chargement des modèles...</p>}
      {error && <p>Erreur : {error}</p>}

      {!loading && templates.length === 0 ? (
        <div className="dtp-empty">
          <DocumentIcon />
          <p>Aucun modèle pour l’instant. Créez-en un pour définir la mise en page d’un document (état de contrat, facture…) et y glisser les champs de fusion.</p>
          <button type="button" className="btn primary" onClick={openCreateModal}>Nouveau modèle</button>
        </div>
      ) : (
        <div className="dtp-grid">
          {templates.map((template) => (
            <div key={template.IDDOCUMENT_TEMPLATES} className="dtp-card" onDoubleClick={() => handleOpen(template.IDDOCUMENT_TEMPLATES)}>
              <div className="dtp-card-preview" aria-hidden="true">
                <DocumentIcon />
              </div>
              <div className="dtp-card-body">
                <p className="dtp-card-name">
                  {template.Nom}
                  <span className="dtp-type-badge">{DOCUMENT_TYPE_LABELS[template.Type_document as DocumentType] ?? template.Type_document}</span>
                </p>
                <p className="dtp-card-date">Modifié le {formatDate(template.Date_heure_modification)}</p>
              </div>
              <div className="dtp-card-actions">
                <button type="button" className="btn" onClick={() => handleOpen(template.IDDOCUMENT_TEMPLATES)}>Ouvrir</button>
                <button type="button" className="icon-btn" title="Dupliquer" onClick={() => handleDuplicate(template.IDDOCUMENT_TEMPLATES)}><CopyIcon /></button>
                <button type="button" className="icon-btn danger" title="Supprimer" onClick={() => handleDelete(template.IDDOCUMENT_TEMPLATES)}><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <Modal title="Nouveau modèle" onClose={() => setCreating(false)}>
          <NewTemplateForm onCreate={handleCreate} onCancel={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  )
}

// Formulaire de la modale « Nouveau modèle ». Composant à part pour repartir
// de zéro à chaque ouverture et suivre sa saisie (voir
// components/unsaved-changes/).
function NewTemplateForm({ onCreate, onCancel }: { onCreate: (nom: string, type: DocumentType) => Promise<void>; onCancel: () => void }) {
  const [nom, setNom] = useState('')
  const [type, setType] = useState<DocumentType>(DOCUMENT_TYPES[0])
  const { formRef, confirmLeave } = useUnsavedForm({ nom, type }, () => onCreate(nom, type))

  return (
    <form
      ref={formRef}
      className="dtp-create-form"
      onSubmit={(e) => {
        e.preventDefault()
        void onCreate(nom, type)
      }}
    >
      <label className="field">
        Nom du modèle
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. État de contrat" autoFocus />
      </label>
      <label className="field">
        Type de document
        <select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
          {DOCUMENT_TYPES.map((option) => (
            <option key={option} value={option}>{DOCUMENT_TYPE_LABELS[option]}</option>
          ))}
        </select>
      </label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary">Créer</button>
      </div>
    </form>
  )
}
