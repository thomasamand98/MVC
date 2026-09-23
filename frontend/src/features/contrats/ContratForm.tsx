import { useRef, useState, type FormEvent } from 'react'
import type { ConditionCmr, ContratDetail } from './useContrats.js'
import type { Societe, SocieteDetail } from '../societes/useSocietes.js'
import type { TypeFacture } from './useTypesFacture.js'
import { ContratConditionsCmr } from './ContratConditionsCmr.js'
import { ContratPrestationsTab } from './ContratPrestationsTab.js'
import { ContratFacturesTab } from './ContratFacturesTab.js'
import { ContratPdfButton } from './ContratPdfButton.js'
import { formatEuro } from './format.js'
import { apiJson } from '../../lib/api.js'
import type { DocumentTemplateSummary } from '../documents/types.js'
import '../../components/PageActions.css'
import './ContratForm.css'

// Champs scripturables d'un contrat affichés dans la fiche, mêmes clés que le
// CreateContratDto côté backend (backend/src/contrat/contrat.dto.ts) : dates
// en "AAAA-MM-JJ", IDSOCIETES/IDTYPES_FACTURE en string (BigInt non
// sérialisable côté JSON), Taux_tva en string (Decimal côté vrai modèle
// Prisma). Offre_de_prix/Archive sont des codes 0/1 côté vrai modèle Prisma
// (pas des booléens). Une valeur vide ('') efface le champ côté serveur.
// Version_contrat/Type_contrat/Qt_client_facturation/Suivant/IDMARCHANDISES
// ne sont pas dans la fiche : l'API les accepte toujours mais ils ne sont
// plus envoyés d'ici, donc jamais écrasés.
export type ContratDto = {
  Num_contrat: string
  Date_debut: string
  Date_fin: string
  Offre_de_prix: number
  Instruction_CMR: string
  IDTYPES_FACTURE: string
  Description_projet: string
  Note_confidentielle: string
  IDSOCIETES: string
  Reference_client: string
  Taux_tva: string
  Commissionnaire: string
  Archive: number
  Annee_archivage: string
}

type Props = {
  initial: ContratDetail | null
  // Sociétés et types de facture pour les sélecteurs — chargés par
  // ContratsPage et passés en prop plutôt que rechargés ici, pour ne pas
  // refaire un GET à chaque ouverture de la fiche.
  societes: Societe[]
  typesFacture: TypeFacture[]
  // Modèles de document de type "CONTRAT", pour le bouton « Voir le PDF »
  // (voir ContratPdfButton.tsx) — même principe que societes/typesFacture.
  documentTemplates: DocumentTemplateSummary[]
  onSubmit: (dto: ContratDto) => Promise<void>
  onCancel: () => void
}

const TABS = [
  { id: 'detail', label: 'Détail' },
  { id: 'prestations', label: 'Prestations' },
  { id: 'factures', label: 'Factures' },
] as const

type TabId = (typeof TABS)[number]['id']

// Convertit une date ISO (renvoyée par l'API) en "AAAA-MM-JJ", format attendu
// par <input type="date">.
function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : ''
}

// Numéro affiché d'un contrat existant : numéro + version (« 1680.24/07 »),
// comme dans l'ancienne fiche. « 0 » est la version par défaut de la base,
// pour un contrat jamais versionné.
function fullNumero(contrat: ContratDetail): string {
  const numero = contrat.Num_contrat ?? ''
  return contrat.Version_contrat && contrat.Version_contrat !== '0' ? `${numero}.${contrat.Version_contrat}` : numero
}

// Fiche complète d'un contrat (voir ContratsPage.tsx), sur le modèle de la
// fiche Société : onglets Détail / Prestations / Factures. `initial` vaut
// null en création, sinon la fiche complète du contrat (GET /contrats/:id,
// voir useContrats.ts) chargée par CrudPage avant l'ouverture. Les onglets
// Prestations/Factures et les conditions CMR se rattachent à un contrat
// existant — désactivés tant qu'il n'est pas créé.
export function ContratForm({ initial, societes, typesFacture, documentTemplates, onSubmit, onCancel }: Props) {
  const [tab, setTab] = useState<TabId>('detail')
  const [form, setForm] = useState<ContratDto>({
    Num_contrat: initial?.Num_contrat ?? '',
    Date_debut: toDateInput(initial?.Date_debut),
    Date_fin: toDateInput(initial?.Date_fin),
    Offre_de_prix: initial?.Offre_de_prix ?? 0,
    Instruction_CMR: initial?.Instruction_CMR ?? '',
    IDTYPES_FACTURE: initial?.IDTYPES_FACTURE ?? '',
    Description_projet: initial?.Description_projet ?? '',
    Note_confidentielle: initial?.Note_confidentielle ?? '',
    IDSOCIETES: initial?.IDSOCIETES ?? '',
    Reference_client: initial?.Reference_client ?? '',
    Taux_tva: initial?.Taux_tva ?? '',
    Commissionnaire: initial?.Commissionnaire ?? '',
    Archive: initial?.Archive ?? 0,
    // "0" est le défaut de la base pour « pas d'année d'archivage ».
    Annee_archivage: initial?.Annee_archivage && initial.Annee_archivage !== '0' ? initial.Annee_archivage : '',
  })
  const [client, setClient] = useState(initial?.Societe?.Client ?? null)
  const [conditions, setConditions] = useState<ConditionCmr[]>(initial?.ConditionCmrs ?? [])
  const [submitting, setSubmitting] = useState(false)
  // Numéro de la dernière requête société lancée : une réponse arrivée en
  // retard après un nouveau changement de société est ignorée.
  const societeRequest = useRef(0)

  const set = <K extends keyof ContratDto>(key: K, value: ContratDto[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  // Changer de société met à jour le numéro client affiché et reprend son
  // taux de TVA par défaut, comme dans l'ancienne fiche WinDev.
  async function handleSocieteChange(id: string) {
    set('IDSOCIETES', id)
    const request = ++societeRequest.current
    if (!id) {
      setClient(null)
      return
    }
    try {
      const societe = await apiJson<SocieteDetail>(`societes/${encodeURIComponent(id)}`)
      if (request !== societeRequest.current) return
      setClient(societe.Client)
      const taux = societe.Client?.Taux_tva
      if (taux) set('Taux_tva', taux)
    } catch {
      if (request === societeRequest.current) setClient(null)
    }
  }

  function handleArchiveChange(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      Archive: checked ? 1 : 0,
      // Année en cours proposée à l'archivage, effacée au désarchivage.
      Annee_archivage: checked ? prev.Annee_archivage || String(new Date().getFullYear()) : '',
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  const counts: Partial<Record<TabId, number>> = {
    prestations: initial?.Prestations.length,
    factures: initial?.Factures.length,
  }

  return (
    <div className="contrat-form">
      <div className="contrat-tabs">
        <div className="contrat-tabs-list" role="tablist">
          {TABS.map((t) => {
            const locked = t.id !== 'detail' && !initial
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`contrat-tab${tab === t.id ? ' active' : ''}`}
                disabled={locked}
                title={locked ? 'Enregistrez d’abord le contrat pour accéder à cet onglet' : undefined}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {counts[t.id] ? <span className="contrat-tab-count">{counts[t.id]}</span> : null}
              </button>
            )
          })}
        </div>
        {initial && <ContratPdfButton contratId={initial.IDCONTRATS} templates={documentTemplates} />}
      </div>

      {tab === 'detail' && (
        <form onSubmit={handleSubmit} className="contrat-detail">
          <div className="contrat-columns">
            <div className="contrat-column">
              <section className="contrat-card">
                <h4 className="contrat-card-title">Contrat</h4>
                <div className="contrat-row">
                  <label className="contrat-field">
                    Numéro
                    {/* Attribué à la création, puis figé (affiché avec sa
                        version) : les factures et commandes s'y réfèrent. */}
                    <input
                      value={initial ? fullNumero(initial) : form.Num_contrat}
                      onChange={(e) => set('Num_contrat', e.target.value)}
                      maxLength={50}
                      readOnly={initial !== null}
                    />
                  </label>
                  <label className="contrat-field">
                    Date d’ouverture
                    <input type="date" value={form.Date_debut} onChange={(e) => set('Date_debut', e.target.value)} />
                  </label>
                  <label className="contrat-field">
                    Date de fin
                    <input type="date" value={form.Date_fin} min={form.Date_debut || undefined} onChange={(e) => set('Date_fin', e.target.value)} />
                  </label>
                </div>
                <label className="contrat-checkbox">
                  <input type="checkbox" checked={form.Offre_de_prix === 1} onChange={(e) => set('Offre_de_prix', e.target.checked ? 1 : 0)} />
                  Offre de prix
                </label>
                <label className="contrat-field">
                  Instruction CMR
                  <input value={form.Instruction_CMR} onChange={(e) => set('Instruction_CMR', e.target.value)} maxLength={250} />
                </label>
                <label className="contrat-field">
                  Type facture
                  <select value={form.IDTYPES_FACTURE} onChange={(e) => set('IDTYPES_FACTURE', e.target.value)}>
                    <option value="">—</option>
                    {typesFacture.map((t) => (
                      <option key={t.IDTYPES_FACTURE} value={t.IDTYPES_FACTURE}>{t.Nom}</option>
                    ))}
                  </select>
                </label>
                <label className="contrat-field">
                  Description du projet
                  <textarea rows={6} value={form.Description_projet} onChange={(e) => set('Description_projet', e.target.value)} maxLength={1000} />
                </label>
                <label className="contrat-field">
                  Note confidentielle
                  <textarea rows={4} value={form.Note_confidentielle} onChange={(e) => set('Note_confidentielle', e.target.value)} maxLength={500} />
                </label>
              </section>
            </div>

            <div className="contrat-column">
              <section className="contrat-card">
                <h4 className="contrat-card-title">Client</h4>
                <div className="contrat-row">
                  <label className="contrat-field contrat-grow">
                    Société
                    <select value={form.IDSOCIETES} onChange={(e) => void handleSocieteChange(e.target.value)}>
                      <option value="">—</option>
                      {societes.map((s) => (
                        <option key={s.IDSOCIETES} value={s.IDSOCIETES}>{s.Nom_societe}</option>
                      ))}
                    </select>
                  </label>
                  <label className="contrat-field">
                    Numéro client
                    <input value={client?.Numero_client ?? ''} readOnly tabIndex={-1} />
                  </label>
                </div>
                <div className="contrat-row">
                  <label className="contrat-field">
                    Référence client
                    <input value={form.Reference_client} onChange={(e) => set('Reference_client', e.target.value)} maxLength={100} />
                  </label>
                  <label className="contrat-field contrat-field-narrow">
                    Taux TVA (%)
                    <input type="number" step="0.01" min="0" value={form.Taux_tva} onChange={(e) => set('Taux_tva', e.target.value)} />
                  </label>
                </div>
                <label className="contrat-field">
                  Commissionnaire
                  <textarea rows={3} value={form.Commissionnaire} onChange={(e) => set('Commissionnaire', e.target.value)} maxLength={250} />
                </label>
              </section>

              <section className="contrat-card">
                <h4 className="contrat-card-title">Archivage</h4>
                <div className="contrat-row contrat-row-center">
                  <label className="contrat-checkbox">
                    <input type="checkbox" checked={form.Archive === 1} onChange={(e) => handleArchiveChange(e.target.checked)} />
                    Archivé
                  </label>
                  <label className="contrat-field contrat-field-narrow">
                    Année
                    <input
                      value={form.Annee_archivage}
                      onChange={(e) => set('Annee_archivage', e.target.value)}
                      maxLength={50}
                      disabled={form.Archive !== 1}
                    />
                  </label>
                </div>
              </section>

              <section className="contrat-card">
                <h4 className="contrat-card-title">Conditions CMR</h4>
                <ContratConditionsCmr contratId={initial?.IDCONTRATS ?? null} conditions={conditions} onChange={setConditions} />
              </section>

              <section className="contrat-card">
                <h4 className="contrat-card-title">Chiffres clés</h4>
                <div className="contrat-kpi">
                  <span className="contrat-kpi-label">CA</span>
                  <span className="contrat-kpi-value">{formatEuro(initial?.Chiffre_affaires ?? 0)}</span>
                </div>
              </section>
            </div>
          </div>

          <div className="contrat-actions">
            <button type="button" className="contrat-button" onClick={onCancel}>Annuler</button>
            <button type="submit" className="page-actions-button primary" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {tab === 'prestations' && initial && <ContratPrestationsTab prestations={initial.Prestations} />}
      {tab === 'factures' && initial && <ContratFacturesTab factures={initial.Factures} />}
    </div>
  )
}
