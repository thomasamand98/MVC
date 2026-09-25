import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Commande } from './useCommandes.js'
import type { Contrat } from '../contrats/useContrats.js'
import { formatNumContrat } from '../contrats/numero.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'
import { FicheField, FicheSection } from '../../components/FicheLayout.js'
import { apiJson } from '../../lib/api.js'
import './CommandeForm.css'

// Champs scripturables d'une commande, mêmes clés que le CreateCommandeDto
// côté backend (backend/src/commande/commande.dto.ts) : IDCONTRATS/
// IDPRESTATIONS en string (BigInt non sérialisable côté JSON, '' = aucun),
// Date_commande en ISO string.
export type CommandeDto = {
  Date_commande: string
  IDCONTRATS: string
  IDPRESTATIONS: string
  QT: number
  QT_planifie: number
  Statut: string
  NumRef: string
  Instruction: string
}

type Props = {
  initial: Commande | null
  // Valeurs préremplies en création (projection depuis une seule ligne,
  // voir components/projection/relations.ts) — ignorées en modification.
  defaults?: Partial<CommandeDto>
  // Liste des contrats pour le sélecteur — chargée par CommandesPage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /contrats à chaque ouverture de la modale.
  contrats: Contrat[]
  onSubmit: (dto: CommandeDto) => Promise<void>
  onCancel: () => void
}

// Prestation proposée dans le sélecteur (GET /contrats/:id/prestations,
// backend/src/contrat/contrat.service.ts → getContratPrestations).
type PrestationOption = { IDPRESTATIONS: string; Description_prestation: string | null; Description_courte: string | null }

// Convertit une date ISO (renvoyée par l'API) en "AAAA-MM-JJ", format attendu
// par <input type="date">.
function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

// Date du jour en "AAAA-MM-JJ" (heure locale), proposée à la création.
function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('fr-BE') : ''
}

// Un id 0 (défaut WinDev) équivaut à « aucun lien ».
function linkId(value: string | null | undefined): string {
  return value && value !== '0' ? value : ''
}

function prestationLabel(p: Pick<PrestationOption, 'Description_prestation' | 'Description_courte'>): string {
  return p.Description_prestation || p.Description_courte || 'Prestation sans description'
}

// Formulaire de saisie utilisé par la modale de création/modification (voir
// CommandesPage.tsx), repris de l'écran WinDev : carte « Informations »
// avec le client, le contrat et ses dates en lecture seule, puis la
// prestation du contrat, la date, la quantité, la référence et l'instruction.
// En création, le contrat se choisit dans une liste ; il n'est plus
// modifiable ensuite. Statut/QT_planifie (gérés par le planning) ne sont pas
// affichés mais conservés.
export function CommandeForm({ initial, defaults, contrats, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CommandeDto>({
    Date_commande: initial ? toDateInput(initial.Date_commande) : today(),
    IDCONTRATS: linkId(initial?.IDCONTRATS),
    IDPRESTATIONS: linkId(initial?.IDPRESTATIONS),
    QT: initial?.QT ?? 0,
    QT_planifie: initial?.QT_planifie ?? 0,
    Statut: initial?.Statut ?? '',
    NumRef: initial?.NumRef && initial.NumRef !== '0' ? initial.NumRef : '',
    Instruction: initial?.Instruction ?? '',
    ...(initial ? {} : defaults),
  })
  const [submitting, setSubmitting] = useState(false)
  const [prestations, setPrestations] = useState<PrestationOption[] | null>(null)

  const sortedContrats = useMemo(
    () => [...contrats].sort((a, b) =>
      (a.Societe?.Nom_societe ?? '').localeCompare(b.Societe?.Nom_societe ?? '', 'fr') || formatNumContrat(a).localeCompare(formatNumContrat(b), 'fr', { numeric: true })),
    [contrats],
  )
  // Contrat choisi : celui de la liste, sinon celui renvoyé avec la commande.
  const contrat = contrats.find((c) => c.IDCONTRATS === form.IDCONTRATS)
    ?? (initial && form.IDCONTRATS === linkId(initial.IDCONTRATS) ? initial.Contrat : null)

  // Prestations du contrat choisi, rechargées quand il change.
  useEffect(() => {
    if (!form.IDCONTRATS) {
      setPrestations([])
      return
    }
    let cancelled = false
    setPrestations(null)
    apiJson<{ prestations: PrestationOption[] }>(`contrats/${form.IDCONTRATS}/prestations`)
      .then((json) => { if (!cancelled) setPrestations(json.prestations) })
      .catch(() => { if (!cancelled) setPrestations([]) })
    return () => {
      cancelled = true
    }
  }, [form.IDCONTRATS])

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

  const set = <K extends keyof CommandeDto>(key: K, value: CommandeDto[K]) => setForm({ ...form, [key]: value })

  // Changer de contrat vide la prestation, qui appartient à l'ancien.
  function changeContrat(id: string) {
    setForm({ ...form, IDCONTRATS: id, IDPRESTATIONS: '' })
  }

  const prestationListed = prestations?.some((p) => p.IDPRESTATIONS === form.IDPRESTATIONS) ?? false

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form fiche">
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>

      <FicheSection title="Informations" className="fiche-section--center">
        <div className="cmd-contrat">
          <div className="field">
            <span className="field-label">Client</span>
            <span className="fiche-readonly">{contrat?.Societe?.Nom_societe || ' '}</span>
          </div>
          {initial ? (
            <div className="field">
              <span className="field-label">Contrat</span>
              <span className="fiche-readonly">{contrat ? formatNumContrat(contrat) : ' '}</span>
            </div>
          ) : (
            <FicheField label="Contrat">
              <select value={form.IDCONTRATS} onChange={(e) => changeContrat(e.target.value)} required>
                <option value="" />
                {sortedContrats.map((c) => (
                  <option key={c.IDCONTRATS} value={c.IDCONTRATS}>
                    {formatNumContrat(c)}{c.Societe?.Nom_societe ? ` — ${c.Societe.Nom_societe}` : ''}
                  </option>
                ))}
              </select>
            </FicheField>
          )}
          <div className="field">
            <span className="field-label">Début du contrat</span>
            <span className="fiche-readonly">{formatDate(contrat?.Date_debut) || ' '}</span>
          </div>
          <div className="field">
            <span className="field-label">Fin du contrat</span>
            <span className="fiche-readonly">{formatDate(contrat?.Date_fin) || ' '}</span>
          </div>
        </div>

        <FicheField label="Prestations">
          <select
            value={form.IDPRESTATIONS}
            onChange={(e) => set('IDPRESTATIONS', e.target.value)}
            disabled={!form.IDCONTRATS}
            title={form.IDCONTRATS ? undefined : 'Choisissez d’abord un contrat'}
          >
            <option value="">{prestations === null ? 'Chargement des prestations...' : ''}</option>
            {/* Prestation liée absente de la liste (pas encore chargée...). */}
            {form.IDPRESTATIONS && !prestationListed && (
              <option value={form.IDPRESTATIONS}>
                {initial?.Prestation && form.IDPRESTATIONS === linkId(initial.IDPRESTATIONS)
                  ? prestationLabel({ Description_prestation: initial.Prestation.Description_prestation, Description_courte: null })
                  : form.IDPRESTATIONS}
              </option>
            )}
            {prestations?.map((p) => (
              <option key={p.IDPRESTATIONS} value={p.IDPRESTATIONS}>{prestationLabel(p)}</option>
            ))}
          </select>
        </FicheField>

        <div className="cmd-saisie">
          <FicheField label="Date commande">
            <input type="date" value={form.Date_commande} onChange={(e) => set('Date_commande', e.target.value)} />
          </FicheField>
          <FicheField label="Quantité">
            <input
              type="number"
              min={0}
              step={1}
              className="cmd-qt"
              value={form.QT}
              onChange={(e) => set('QT', Number(e.target.value))}
            />
          </FicheField>
          <FicheField label="Référence">
            <input value={form.NumRef} maxLength={50} onChange={(e) => set('NumRef', e.target.value)} />
          </FicheField>
        </div>

        <FicheField label="Instruction">
          <input value={form.Instruction} maxLength={300} onChange={(e) => set('Instruction', e.target.value)} />
        </FicheField>
      </FicheSection>
    </form>
  )
}
