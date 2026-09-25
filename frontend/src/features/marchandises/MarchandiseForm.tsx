import { useEffect, useState, type FormEvent } from 'react'
import type { MarchandiseDetail } from './useMarchandises.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'
import { FicheField, FicheSection, FicheSwitch, PlusIcon } from '../../components/FicheLayout.js'
import { ColorField } from '../../components/ColorField.js'
import { apiJson } from '../../lib/api'
import './MarchandiseForm.css'

// Champs scripturables d'une marchandise, mêmes clés que le
// CreateMarchandiseDto côté backend (backend/src/marchandise/marchandise.dto.ts) :
// CouleurPlanning/IDDECHETS en string (BigInt non sérialisable côté JSON).
// CouleurPlanning est une couleur WinDev (voir lib/windevColor.ts), '0' =
// aucune ; IDDECHETS '' = aucun déchet. Is_dechet/Archive sont des codes 0/1
// côté vrai modèle Prisma (pas des booléens).
export type MarchandiseDto = {
  Nom_marchandise: string
  CouleurPlanning: string
  IDDECHETS: string
  Is_dechet: number
  Archive: number
}

type Props = {
  initial: MarchandiseDetail | null
  onSubmit: (dto: MarchandiseDto) => Promise<void>
  onCancel: () => void
}

// Déchet tel que renvoyé par GET /dechets (backend/src/dechet/dechet.service.ts).
type Dechet = { IDDECHETS: string; Code: string | null; Description_dechet: string | null }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// MarchandisesPage.tsx). `initial` vaut null en création, sinon la fiche
// complète de la marchandise (GET /marchandises/:id, voir
// useMarchandises.ts) chargée par CrudPage avant l'ouverture de la modale.
export function MarchandiseForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MarchandiseDto>({
    Nom_marchandise: initial?.Nom_marchandise ?? '',
    CouleurPlanning: initial?.CouleurPlanning ?? '0',
    IDDECHETS: initial?.IDDECHETS && initial.IDDECHETS !== '0' ? initial.IDDECHETS : '',
    Is_dechet: initial?.Is_dechet ?? 0,
    Archive: initial?.Archive ?? 0,
  })
  // Code/description du déchet lié, pour l'affichage seulement.
  const [dechet, setDechet] = useState<Dechet | null>(
    initial?.Dechet && form.IDDECHETS ? { IDDECHETS: form.IDDECHETS, ...initial.Dechet } : null,
  )
  const [picking, setPicking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function save() {
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  // Quitter la fiche modifiée demande « Enregistrer / Annuler les
  // modifications » (voir components/unsaved-changes/).
  const { formRef, confirmLeave } = useUnsavedForm(form, save)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  function selectDechet(next: Dechet | null) {
    setDechet(next)
    setForm({ ...form, IDDECHETS: next?.IDDECHETS ?? '', Is_dechet: next ? 1 : 0 })
    setPicking(false)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form fiche">
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>

      <FicheSection
        title="Marchandise"
        className="fiche-section--center mf-section"
        aside={<FicheSwitch label="Archivée" checked={form.Archive === 1} onChange={(on) => setForm({ ...form, Archive: on ? 1 : 0 })} />}
      >
        <div className="mf-row">
          <FicheField label="Nom">
            <input value={form.Nom_marchandise} maxLength={100} onChange={(e) => setForm({ ...form, Nom_marchandise: e.target.value })} />
          </FicheField>
          <div className="field">
            <span className="field-label">Couleur</span>
            <ColorField
              label="Couleur planning"
              value={Number(form.CouleurPlanning) || 0}
              onChange={(color) => setForm({ ...form, CouleurPlanning: String(color) })}
            />
          </div>
        </div>
      </FicheSection>

      <FicheSection
        title="Déchets"
        className="fiche-section--center mf-section"
        aside={
          <div className="mf-dechet-actions">
            <button type="button" className="mf-icon-btn" onClick={() => setPicking(!picking)} title={dechet ? 'Changer de déchet' : 'Choisir un déchet'} aria-expanded={picking}>
              <PlusIcon />
            </button>
            <button type="button" className="mf-icon-btn mf-icon-btn--remove" onClick={() => selectDechet(null)} disabled={!dechet} title="Retirer le déchet" aria-label="Retirer le déchet">
              −
            </button>
          </div>
        }
      >
        {picking && <DechetPicker onSelect={selectDechet} onClose={() => setPicking(false)} />}
        <div className="mf-dechet">
          <div className="field">
            <span className="field-label">Code Déchets</span>
            <span className="fiche-readonly mf-dechet-code">{dechet?.Code || ' '}</span>
          </div>
          <div className="field">
            <span className="field-label">Description</span>
            <span className="fiche-readonly">{dechet?.Description_dechet || ' '}</span>
          </div>
        </div>
      </FicheSection>
    </form>
  )
}

// Recherche d'un déchet par code ou description (GET /dechets?search=),
// relancée 250 ms après la dernière frappe.
function DechetPicker({ onSelect, onClose }: { onSelect: (d: Dechet) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Dechet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      apiJson<{ dechets: Dechet[] }>(`dechets?search=${encodeURIComponent(search)}`)
        .then((json) => { if (!cancelled) setResults(json.dechets) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  return (
    <div className="mf-picker">
      <input
        autoFocus
        type="search"
        placeholder="Rechercher un code ou une description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          // Entrée ne doit pas enregistrer la fiche ; elle choisit le seul résultat.
          if (e.key === 'Enter') {
            e.preventDefault()
            if (results.length === 1) onSelect(results[0])
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        aria-label="Rechercher un déchet"
      />
      <ul className="mf-picker-list" aria-busy={loading}>
        {results.map((d) => (
          <li key={d.IDDECHETS}>
            <button type="button" onClick={() => onSelect(d)}>
              <span className="mf-picker-code">{d.Code}</span>
              <span>{d.Description_dechet}</span>
            </button>
          </li>
        ))}
        {!loading && results.length === 0 && <li className="mf-picker-empty">Aucun déchet trouvé.</li>}
      </ul>
    </div>
  )
}
