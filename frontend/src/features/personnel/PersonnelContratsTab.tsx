import { useState, type FormEvent } from 'react'
import { formatDate, formatEuro } from '../contrats/format.js'
import { PencilIcon, PlusIcon, TrashIcon } from '../../components/PageActions.js'
import {
  useContratsTravail,
  type ContratTravail,
  type ContratTravailDto,
  type TauxHoraire,
  type TauxHoraireDto,
} from './useContratsTravail.js'
import './PersonnelContratsTab.css'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'

type Props = {
  personnelId: string
  // Valeurs de la fiche personnel reprises dans un nouveau contrat.
  defaults: Pick<ContratTravailDto, 'Qualification' | 'Routier' | 'Manutention' | 'Atelier'>
}

type RateField = Exclude<keyof TauxHoraireDto, 'IDTAUX_HORAIRE' | 'Date_application'>

// Libellés et unités des taux (écran WinDev : Taux brut, T.H. nuit...).
const RATES: { field: RateField; label: string; unit: string }[] = [
  { field: 'Taux_horaire', label: 'Taux brut', unit: '/ h' },
  { field: 'Taux_horaire_supplementaire', label: 'Heure sup.', unit: '/ h' },
  { field: 'Taux_horaire_nuitee', label: 'Heure de nuit', unit: '/ h' },
  { field: 'Taux_nuitee', label: 'Nuitée', unit: '/ nuit' },
  { field: 'Taux_samedi', label: 'Forfait samedi', unit: '/ jour' },
  { field: 'Taux_cheque_repas', label: 'Chèque repas', unit: '/ jour' },
  { field: 'Taux_stanby', label: 'Standby', unit: '/ h' },
]

const ACTIVITES = [
  { field: 'Routier', label: 'Routier' },
  { field: 'Manutention', label: 'Manutention' },
  { field: 'Atelier', label: 'Atelier' },
] as const

const TYPES_CONTRAT = ['CDI', 'CDD', 'Intérim', 'Étudiant', 'Flexi-job']

const today = () => new Date().toISOString().slice(0, 10)

// Les dates en 2099 ou après sont une convention WinDev pour « sans limite ».
const isOpenEnded = (day: string | null) => !day || Number(day.slice(0, 4)) >= 2099

type Status = { tone: 'current' | 'past' | 'future'; label: string }

function statusOf(c: Pick<ContratTravail, 'Date_debut' | 'Date_fin'>): Status {
  const now = today()
  if (c.Date_debut && c.Date_debut.slice(0, 10) > now) return { tone: 'future', label: 'À venir' }
  if (!isOpenEnded(c.Date_fin) && c.Date_fin!.slice(0, 10) < now) return { tone: 'past', label: 'Terminé' }
  return { tone: 'current', label: 'En cours' }
}

// Taux applicable : le plus récent dont la date d'application est passée à
// la date de référence (aujourd'hui, ou la fin d'un contrat terminé). Les
// taux arrivent triés du plus récent au plus ancien.
function applicableRate(c: ContratTravail): TauxHoraire | undefined {
  const ref = isOpenEnded(c.Date_fin) ? today() : [today(), c.Date_fin!.slice(0, 10)].sort()[0]
  return c.TauxHoraireContratTravails.find((t) => !t.Date_application || t.Date_application.slice(0, 10) <= ref)
}

// Onglet « Contrat » de la fiche personnel : contrats de travail du plus
// récent au plus ancien, chacun avec ses taux horaires (celui en vigueur mis
// en avant, les précédents dans l'historique). Un seul contrat modifiable à
// la fois, directement dans sa carte.
export function PersonnelContratsTab({ personnelId, defaults }: Props) {
  const { contrats, loading, error, refetch, create, update, remove } = useContratsTravail(personnelId)
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  async function handleDelete(c: ContratTravail) {
    const label = [c.TypeContrat, c.Qualification].filter(Boolean).join(' · ') || 'ce contrat'
    if (!confirm(`Supprimer le contrat « ${label} » et ses taux horaires ?`)) return
    try {
      await remove(c.IDCONTRATS_TRAVAIL)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  if (loading) return <p className="muted">Chargement des contrats…</p>
  if (error) {
    return (
      <div className="pct-empty">
        <p>Impossible de charger les contrats : {error}</p>
        <button type="button" className="btn" onClick={refetch}>Réessayer</button>
      </div>
    )
  }

  return (
    <div className="pct">
      <div className="pct-toolbar">
        <h4 className="pct-title">
          Contrats de travail <span className="pct-count">{contrats.length}</span>
        </h4>
        <button type="button" className="btn primary" onClick={() => setEditing('new')} disabled={editing !== null}>
          <PlusIcon />
          Nouveau contrat
        </button>
      </div>

      {editing === 'new' && (
        <ContratEditor
          initial={null}
          defaults={defaults}
          onCancel={() => setEditing(null)}
          onSubmit={async (dto) => {
            await create(dto)
            setEditing(null)
          }}
        />
      )}

      {contrats.length === 0 && editing !== 'new' && (
        <div className="pct-empty">
          <p>Aucun contrat de travail pour ce personnel.</p>
          <button type="button" className="btn" onClick={() => setEditing('new')}>Créer le premier contrat</button>
        </div>
      )}

      {contrats.map((c) =>
        editing === c.IDCONTRATS_TRAVAIL ? (
          <ContratEditor
            key={c.IDCONTRATS_TRAVAIL}
            initial={c}
            defaults={defaults}
            onCancel={() => setEditing(null)}
            onSubmit={async (dto) => {
              await update(c.IDCONTRATS_TRAVAIL, dto)
              setEditing(null)
            }}
          />
        ) : (
          <ContratCard
            key={c.IDCONTRATS_TRAVAIL}
            contrat={c}
            locked={editing !== null}
            onEdit={() => setEditing(c.IDCONTRATS_TRAVAIL)}
            onDelete={() => handleDelete(c)}
          />
        ),
      )}
    </div>
  )
}

function ContratCard({ contrat: c, locked, onEdit, onDelete }: { contrat: ContratTravail; locked: boolean; onEdit: () => void; onDelete: () => void }) {
  const status = statusOf(c)
  const current = applicableRate(c)
  const history = c.TauxHoraireContratTravails.filter((t) => t !== current)
  const activites = ACTIVITES.filter((a) => c[a.field] === 1)

  return (
    <article className={`pct-card pct-card--${status.tone}`}>
      <header className="pct-card-head">
        <span className="pct-type">{c.TypeContrat || '—'}</span>
        <div className="pct-card-heading">
          <strong>{c.Qualification || 'Qualification non renseignée'}</strong>
          <span className="pct-period">
            {formatDate(c.Date_debut)} → {isOpenEnded(c.Date_fin) ? 'indéterminée' : formatDate(c.Date_fin)}
            {c.Societe?.Nom_societe && <> · {c.Societe.Nom_societe}</>}
          </span>
        </div>
        <span className={`pct-status pct-status--${status.tone}`}>{status.label}</span>
        <div className="page-actions">
          <button type="button" className="btn" onClick={onEdit} disabled={locked}>
            <PencilIcon />
            Modifier
          </button>
          <button type="button" className="btn danger" onClick={onDelete} disabled={locked}>
            <TrashIcon />
            Supprimer
          </button>
        </div>
      </header>

      {activites.length > 0 && (
        <ul className="pct-tags" aria-label="Activités">
          {activites.map((a) => <li key={a.field}>{a.label}</li>)}
        </ul>
      )}

      {current ? (
        <section className="pct-rates" aria-label="Taux en vigueur">
          <p className="pct-rates-caption">
            {status.tone === 'past' ? 'Derniers taux' : 'Taux en vigueur'}
            {current.Date_application && <> depuis le <strong>{formatDate(current.Date_application)}</strong></>}
          </p>
          <dl className="pct-metrics">
            {RATES.map((r) => (
              <div key={r.field} className={`pct-metric${r.field === 'Taux_horaire' ? ' pct-metric--main' : ''}`}>
                <dt>{r.label}</dt>
                <dd>
                  {formatEuro(current[r.field])} <small>{r.unit}</small>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <p className="muted">Aucun taux horaire applicable.</p>
      )}

      {history.length > 0 && (
        <details className="pct-history">
          <summary>Historique des taux ({history.length})</summary>
          <div className="pct-table-wrapper">
            <table className="pct-table">
              <thead>
                <tr>
                  <th>À partir du</th>
                  {RATES.map((r) => <th key={r.field} className="pct-num">{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.IDTAUX_HORAIRE}>
                    <td>{formatDate(t.Date_application)}</td>
                    {RATES.map((r) => <td key={r.field} className="pct-num">{formatEuro(t[r.field])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </article>
  )
}

type EditorProps = {
  initial: ContratTravail | null
  defaults: Props['defaults']
  onSubmit: (dto: ContratTravailDto) => Promise<void>
  onCancel: () => void
}

// Les Decimal arrivent en "13.400000" : affichés sans zéros superflus.
const toRateInput = (value: string | null) => (value === null ? '' : String(Number(value)))

function emptyRate(from?: TauxHoraireDto): TauxHoraireDto {
  return {
    Date_application: today(),
    Taux_horaire: from?.Taux_horaire ?? '',
    Taux_horaire_supplementaire: from?.Taux_horaire_supplementaire ?? '',
    Taux_horaire_nuitee: from?.Taux_horaire_nuitee ?? '',
    Taux_nuitee: from?.Taux_nuitee ?? '',
    Taux_samedi: from?.Taux_samedi ?? '',
    Taux_cheque_repas: from?.Taux_cheque_repas ?? '',
    Taux_stanby: from?.Taux_stanby ?? '',
  }
}

function ContratEditor({ initial, defaults, onSubmit, onCancel }: EditorProps) {
  const [form, setForm] = useState<ContratTravailDto>(() => ({
    TypeContrat: initial?.TypeContrat ?? '',
    Qualification: initial ? (initial.Qualification ?? '') : defaults.Qualification,
    Date_debut: initial?.Date_debut?.slice(0, 10) ?? today(),
    Date_fin: initial?.Date_fin?.slice(0, 10) ?? '',
    Routier: initial ? (initial.Routier ?? 0) : defaults.Routier,
    Manutention: initial ? (initial.Manutention ?? 0) : defaults.Manutention,
    Atelier: initial ? (initial.Atelier ?? 0) : defaults.Atelier,
    Taux: initial
      ? initial.TauxHoraireContratTravails.map((t) => ({
          IDTAUX_HORAIRE: t.IDTAUX_HORAIRE,
          Date_application: t.Date_application?.slice(0, 10) ?? '',
          ...(Object.fromEntries(RATES.map((r) => [r.field, toRateInput(t[r.field])])) as Record<RateField, string>),
        }))
      : [emptyRate()],
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ContratTravailDto>(key: K, value: ContratTravailDto[K]) => setForm((prev) => ({ ...prev, [key]: value }))
  const setRate = (index: number, patch: Partial<TauxHoraireDto>) =>
    set('Taux', form.Taux.map((t, i) => (i === index ? { ...t, ...patch } : t)))

  async function save() {
    if (form.Date_fin && form.Date_debut && form.Date_fin < form.Date_debut) {
      setError('La date de fin doit être postérieure à la date de début.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // Quitter le contrat modifié (Annuler, ou fermer la fiche personnel)
  // demande « Enregistrer / Annuler les modifications ».
  const { formRef, confirmLeave } = useUnsavedForm(form, save)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  return (
    <form ref={formRef} className="pct-card pct-card--editing" onSubmit={handleSubmit}>
      {/* Boutons en haut, comme sur les autres fiches. */}
      <div className="pct-editor-head">
        <p className="pct-editing-title">{initial ? 'Modifier le contrat' : 'Nouveau contrat'}</p>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)} disabled={submitting}>Annuler</button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && <p className="alert-error" role="alert">{error}</p>}

      <div className="pct-fields">
        <label className="field">
          <span className="field-label">Type de contrat</span>
          <input value={form.TypeContrat} maxLength={50} list="pct-types" onChange={(e) => set('TypeContrat', e.target.value)} placeholder="CDI, CDD…" />
          <datalist id="pct-types">{TYPES_CONTRAT.map((t) => <option key={t} value={t} />)}</datalist>
        </label>
        <label className="field">
          <span className="field-label">Qualification</span>
          <input value={form.Qualification} maxLength={50} onChange={(e) => set('Qualification', e.target.value)} placeholder="Ex. Chauffeur > 15 T" />
        </label>
        <label className="field">
          <span className="field-label">Date de début</span>
          <input type="date" value={form.Date_debut} onChange={(e) => set('Date_debut', e.target.value)} required />
        </label>
        <label className="field">
          <span className="field-label">Date de fin <em>(vide = indéterminée)</em></span>
          <input type="date" value={form.Date_fin} min={form.Date_debut || undefined} onChange={(e) => set('Date_fin', e.target.value)} />
        </label>
      </div>

      <div className="pf-activities" role="group" aria-label="Activités">
        {ACTIVITES.map((a) => (
          <button
            key={a.field}
            type="button"
            className={`pf-chip${form[a.field] === 1 ? ' is-on' : ''}`}
            aria-pressed={form[a.field] === 1}
            onClick={() => set(a.field, form[a.field] === 1 ? 0 : 1)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="pct-rates-editor">
        <div className="pct-rates-editor-head">
          <span className="pf-section-title">Taux horaires</span>
          <button type="button" className="btn ghost sm" onClick={() => set('Taux', [emptyRate(form.Taux[0]), ...form.Taux])}>
            + Nouveau taux
          </button>
        </div>
        {form.Taux.length === 0 && <p className="muted">Aucun taux : ajoutez-en un pour calculer les pointages.</p>}
        {form.Taux.map((t, index) => (
          <fieldset key={t.IDTAUX_HORAIRE ?? `new-${index}`} className="pct-rate-row">
            <legend className="sr-only">Taux {index + 1}</legend>
            <label className="field">
              <span className="field-label">À partir du</span>
              <input type="date" value={t.Date_application} onChange={(e) => setRate(index, { Date_application: e.target.value })} required />
            </label>
            {RATES.map((r) => (
              <label key={r.field} className="field">
                <span className="field-label">{r.label}</span>
                <span className="pct-euro">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={t[r.field] ?? ''}
                    onChange={(e) => setRate(index, { [r.field]: e.target.value })}
                  />
                </span>
              </label>
            ))}
            <button
              type="button"
              className="icon-btn sm danger pct-remove"
              onClick={() => set('Taux', form.Taux.filter((_, i) => i !== index))}
              aria-label={`Retirer le taux ${index + 1}`}
              title="Retirer ce taux"
            >
              ×
            </button>
          </fieldset>
        ))}
      </div>

    </form>
  )
}
