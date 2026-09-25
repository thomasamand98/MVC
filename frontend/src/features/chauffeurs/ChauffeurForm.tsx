import { useMemo, useState, type FormEvent } from 'react'
import type { Chauffeur } from './useChauffeurs.js'
import type { Societe } from '../societes/useSocietes.js'
import type { Personnel } from '../personnel/usePersonnel.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'
import { FicheField, FicheSwitch } from '../../components/FicheLayout.js'
import { useEnumerationLabels } from '../../lib/useEnumerationLabels.js'
import './ChauffeurForm.css'

// Champs scripturables d'un chauffeur, mêmes clés que le
// CreateChauffeurDto côté backend (backend/src/chauffeur/chauffeur.dto.ts) :
// IDPERSONNELS/IDSOCIETES en string (BigInt non sérialisable côté JSON),
// '' = aucun lien. Categorie est la `Valeur` d'une entrée de l'énumération
// « categorie_chauffeur ». Archive est un code 0/1 côté vrai modèle Prisma
// (pas un booléen).
export type ChauffeurDto = {
  Nom_chauffeur: string
  Telephone: string
  Categorie: string
  Archive: number
  IDPERSONNELS: string
  IDSOCIETES: string
}

type Props = {
  initial: Chauffeur | null
  // Valeurs préremplies en création (projection depuis une seule ligne,
  // voir components/projection/relations.ts) — ignorées en modification.
  defaults?: Partial<ChauffeurDto>
  // Listes des sociétés et du personnel pour les sélecteurs — chargées par
  // ChauffeursPage et passées en prop plutôt que rechargées ici, pour ne
  // pas refaire les GET à chaque ouverture de la modale.
  societes: Societe[]
  personnel: Personnel[]
  onSubmit: (dto: ChauffeurDto) => Promise<void>
  onCancel: () => void
}

function personnelName(p: Pick<Personnel, 'Nom_Personnel' | 'Prenom_Personnel'>): string {
  return [p.Nom_Personnel, p.Prenom_Personnel].filter(Boolean).join(' ')
}

// Un id 0 (défaut WinDev) équivaut à « aucun lien ».
function linkId(value: string | null | undefined): string {
  return value && value !== '0' ? value : ''
}

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ChauffeursPage.tsx). `initial` vaut null en création, sinon pré-remplit
// les champs avec la ligne cliquée dans le tableau. « Email planning » est
// l'e-mail professionnel du salarié lié, en lecture seule (il se modifie
// sur la fiche personnel).
export function ChauffeurForm({ initial, defaults, societes, personnel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ChauffeurDto>({
    Nom_chauffeur: initial?.Nom_chauffeur ?? '',
    Telephone: initial?.Telephone ?? '',
    Categorie: initial?.Categorie ?? '',
    Archive: initial?.Archive ?? 0,
    IDPERSONNELS: linkId(initial?.IDPERSONNELS),
    IDSOCIETES: linkId(initial?.IDSOCIETES),
    ...(initial ? {} : defaults),
  })
  const [submitting, setSubmitting] = useState(false)
  const categories = useEnumerationLabels('categorie_chauffeur')

  const sortedPersonnel = useMemo(
    () => [...personnel].sort((a, b) => personnelName(a).localeCompare(personnelName(b), 'fr')),
    [personnel],
  )
  const sortedSocietes = useMemo(
    () => [...societes].sort((a, b) => (a.Nom_societe ?? '').localeCompare(b.Nom_societe ?? '', 'fr')),
    [societes],
  )

  // E-mail du salarié choisi ; tant que la liste n'est pas chargée, celui
  // renvoyé avec le chauffeur (même salarié).
  const linked = sortedPersonnel.find((p) => p.IDPERSONNELS === form.IDPERSONNELS)
  const emailPlanning = form.IDPERSONNELS
    ? (linked?.E_mail_professionnel ?? (form.IDPERSONNELS === linkId(initial?.IDPERSONNELS) ? initial?.Personnel?.E_mail_professionnel : null))
    : null

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

  const set = <K extends keyof ChauffeurDto>(key: K, value: ChauffeurDto[K]) => setForm({ ...form, [key]: value })

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form fiche">
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>

      <section className="fiche-section">
        <div className="chf-grid">
          <FicheField label="Entreprise">
            <select value={form.IDSOCIETES} onChange={(e) => set('IDSOCIETES', e.target.value)}>
              <option value="" />
              {/* Société liée pas encore dans la liste chargée. */}
              {form.IDSOCIETES && !sortedSocietes.some((s) => s.IDSOCIETES === form.IDSOCIETES) && (
                <option value={form.IDSOCIETES}>{initial?.Societe?.Nom_societe ?? form.IDSOCIETES}</option>
              )}
              {sortedSocietes.map((s) => (
                <option key={s.IDSOCIETES} value={s.IDSOCIETES}>{s.Nom_societe}</option>
              ))}
            </select>
          </FicheField>
          <FicheField label="Catégorie">
            <select value={form.Categorie} onChange={(e) => set('Categorie', e.target.value)}>
              <option value="" />
              {form.Categorie && !(form.Categorie in categories) && <option value={form.Categorie}>{form.Categorie}</option>}
              {Object.entries(categories).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
          </FicheField>
          <FicheField label="Nom">
            <input value={form.Nom_chauffeur} maxLength={50} onChange={(e) => set('Nom_chauffeur', e.target.value)} />
          </FicheField>
          <FicheField label="Téléphone">
            <input type="tel" value={form.Telephone} maxLength={50} onChange={(e) => set('Telephone', e.target.value)} />
          </FicheField>
          <FicheField label="Lien salarié">
            <select value={form.IDPERSONNELS} onChange={(e) => set('IDPERSONNELS', e.target.value)}>
              <option value="" />
              {form.IDPERSONNELS && !linked && (
                <option value={form.IDPERSONNELS}>{initial?.Personnel ? personnelName(initial.Personnel) : form.IDPERSONNELS}</option>
              )}
              {sortedPersonnel.map((p) => (
                <option key={p.IDPERSONNELS} value={p.IDPERSONNELS}>{personnelName(p) || p.IDPERSONNELS}</option>
              ))}
            </select>
          </FicheField>
          <div className="field">
            <span className="field-label">Email planning</span>
            <span className="fiche-readonly" title="E-mail professionnel du salarié lié">{emailPlanning || ' '}</span>
          </div>
        </div>
        <FicheSwitch label="Archivé" checked={form.Archive === 1} onChange={(on) => set('Archive', on ? 1 : 0)} />
      </section>
    </form>
  )
}
