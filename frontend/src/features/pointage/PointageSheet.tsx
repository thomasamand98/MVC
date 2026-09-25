import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Modal } from '../../components/Modal.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { addDays, daysInRange, formatDate, formatMoney, formatWeekday, fromInputValue, isSameDay, isWeekend, toInputValue } from '../planning/dateUtils.js'
import { ChevronLeftIcon, ChevronRightIcon } from '../planning/icons.js'
import { usePersonnel } from '../personnel/usePersonnel.js'
import { PointageForm, type PointageDto } from './PointageForm.js'
import { useFeuillePointage } from './useFeuillePointage.js'
import { useTypesStatut } from './useTypesStatut.js'
import { buildDays, clockTime, computeAmounts, computeTotals, formatDuration, timeMinutes, totalMinutes, workedMinutes, type PointageFeuille, type SheetTotals, type TauxHoraire } from './feuille.js'
import { windevColorToHex } from '../../lib/windevColor.js'
import type { Pointage } from './usePointage.js'
import './PointageSheet.css'

// Au-delà, la feuille devient illisible (le backend refuse aussi).
const MAX_DAYS = 93
const PERSONNEL_STORAGE_KEY = 'mvc-template:pointagePersonnel'

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
const monthValue = (d: Date) => toInputValue(d).slice(0, 7)
const monthLabel = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

function readStoredPersonnel(): string {
  try {
    return localStorage.getItem(PERSONNEL_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

type Editing = { pointage: PointageFeuille | null; date: string }

// Feuille de pointage (menu Gestion personnel → Pointage) : un salarié, une
// période (un mois par défaut), une ligne par jour. Choisir un mois cale la
// période sur ce mois ; choisir une période affiche le mois de sa date de
// début. Cliquer sur un jour ouvre la saisie du pointage de ce jour.
export function PointageSheet() {
  const [personnelId, setPersonnelId] = useState(readStoredPersonnel)
  const [from, setFrom] = useState(() => startOfMonth(new Date()))
  const [to, setTo] = useState(() => endOfMonth(new Date()))
  const [editing, setEditing] = useState<Editing | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { personnel, loading: personnelLoading } = usePersonnel()
  const { statuts } = useTypesStatut()
  const { feuille, error, loading, reload } = useFeuillePointage(personnelId || null, from, to)
  const { create, update } = useApiMutation<PointageDto, Pointage>('pointage')

  useEffect(() => {
    try {
      localStorage.setItem(PERSONNEL_STORAGE_KEY, personnelId)
    } catch {
      // Stockage indisponible : le salarié ne sera simplement pas retenu.
    }
  }, [personnelId])

  const salaries = [...personnel].sort((a, b) =>
    `${a.Nom_Personnel ?? ''} ${a.Prenom_Personnel ?? ''}`.localeCompare(`${b.Nom_Personnel ?? ''} ${b.Prenom_Personnel ?? ''}`, 'fr'),
  )
  // Un salarié retenu d'une session précédente mais supprimé depuis.
  const selectedKnown = !personnelId || personnelLoading || salaries.some((p) => p.IDPERSONNELS === personnelId)
  const days = buildDays(daysInRange(from, to), feuille?.pointages ?? [])
  const totals = computeTotals(days)

  // --- Période -----------------------------------------------------------

  function selectMonth(date: Date) {
    setFrom(startOfMonth(date))
    setTo(endOfMonth(date))
  }

  function changeMonth(value: string) {
    const [y, m] = value.split('-').map(Number)
    if (y && m) selectMonth(new Date(y, m - 1, 1))
  }

  function changeFrom(value: string) {
    const date = fromInputValue(value)
    if (!date) return
    setFrom(date)
    if (date > to) setTo(date)
    else if (daysInRange(date, to).length > MAX_DAYS) setTo(addDays(date, MAX_DAYS - 1))
  }

  function changeTo(value: string) {
    const date = fromInputValue(value)
    if (!date) return
    setTo(date)
    if (date < from) setFrom(date)
    else if (daysInRange(from, date).length > MAX_DAYS) setFrom(addDays(date, -(MAX_DAYS - 1)))
  }

  // --- Saisie ------------------------------------------------------------

  function openDay(date: string, pointage: PointageFeuille | null) {
    setSaveError(null)
    setEditing({ date, pointage })
  }

  async function save(dto: PointageDto) {
    if (!editing) return
    try {
      if (editing.pointage) await update(editing.pointage.IDPOINTAGES, dto)
      else await create(dto)
      setEditing(null)
      reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "L'enregistrement a échoué.")
    }
  }

  return (
    <div className="pt">
      <header className="pt-toolbar">
        <h2 className="pt-title">Pointage</h2>

        <label className="pt-field pt-field--salarie">
          <span className="pt-field-label">Salarié</span>
          <select value={personnelId} onChange={(e) => setPersonnelId(e.target.value)} className={personnelId ? '' : 'is-empty'}>
            <option value="">{personnelLoading ? 'Chargement…' : 'Choisir un salarié…'}</option>
            {salaries.map((p) => (
              <option key={p.IDPERSONNELS} value={p.IDPERSONNELS}>
                {[p.Nom_Personnel, p.Prenom_Personnel].filter(Boolean).join(' ') || `Salarié ${p.IDPERSONNELS}`}
              </option>
            ))}
          </select>
        </label>

        <div className="pt-field">
          <span className="pt-field-label">Mois</span>
          <div className="pt-month">
            <button type="button" className="icon-btn outlined" onClick={() => selectMonth(new Date(from.getFullYear(), from.getMonth() - 1, 1))} aria-label="Mois précédent">
              <ChevronLeftIcon />
            </button>
            <input type="month" value={monthValue(from)} onChange={(e) => changeMonth(e.target.value)} aria-label={`Mois : ${monthLabel(from)}`} />
            <button type="button" className="icon-btn outlined" onClick={() => selectMonth(new Date(from.getFullYear(), from.getMonth() + 1, 1))} aria-label="Mois suivant">
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        <div className="pt-field">
          <span className="pt-field-label">Période</span>
          <div className="pt-period">
            <label className="pt-date">
              <span>Du</span>
              <strong>{formatWeekday(from)}</strong>
              <input type="date" value={toInputValue(from)} onChange={(e) => changeFrom(e.target.value)} />
            </label>
            <label className="pt-date">
              <span>au</span>
              <strong>{formatWeekday(to)}</strong>
              <input type="date" value={toInputValue(to)} onChange={(e) => changeTo(e.target.value)} />
            </label>
          </div>
        </div>
      </header>

      {!personnelId || !selectedKnown ? (
        <div className="pt-empty">
          <div className="pt-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </div>
          <h3>Sélectionnez un salarié</h3>
          <p>Choisissez un salarié dans la liste ci-dessus pour afficher son pointage sur la période.</p>
        </div>
      ) : (
        <div className={`pt-body${loading ? ' is-loading' : ''}`} aria-busy={loading}>
          <section className="pt-sheet" aria-label="Feuille de pointage">
            {error && (
              <div className="pt-alert" role="alert">
                {error}
                <button type="button" className="btn sm" onClick={reload}>Réessayer</button>
              </div>
            )}
            <div className="pt-table-scroll">
              <table className="pt-table">
                <thead>
                  <tr>
                    <th scope="col" className="pt-col-date">Date</th>
                    <th scope="col">Début</th>
                    <th scope="col">Fin</th>
                    <th scope="col">Coupure</th>
                    <th scope="col">Total</th>
                    <th scope="col">Travaillé</th>
                    <th scope="col">Nuit</th>
                    <th scope="col">Liaison</th>
                    <th scope="col">Standby</th>
                    <th scope="col" className="pt-col-text">Statut</th>
                    <th scope="col">Nuitée</th>
                    <th scope="col" className="pt-col-text pt-col-remark">Remarque</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const rows = day.pointages.length > 0 ? day.pointages : [null]
                    const rowClass = `${isWeekend(day.date) ? ' is-weekend' : ''}${isSameDay(day.date, new Date()) ? ' is-today' : ''}`
                    return rows.map((p, index) => (
                      <tr
                        key={p?.IDPOINTAGES ?? day.key}
                        className={`pt-row${p ? '' : ' is-blank'}${rowClass}${index > 0 ? ' is-continuation' : ''}`}
                        tabIndex={0}
                        aria-label={`${p ? 'Modifier' : 'Saisir'} le pointage du ${formatWeekday(day.date)} ${formatDate(day.date)}`}
                        onClick={() => openDay(day.key, p)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDay(day.key, p)
                          }
                        }}
                      >
                        <td className="pt-col-date">
                          {index === 0 && (
                            <>
                              <span className="pt-weekday">{formatWeekday(day.date)}</span>
                              <span className="pt-daynum">{day.date.getDate()}</span>
                            </>
                          )}
                        </td>
                        {p ? <PointageCells pointage={p} /> : <BlankCells />}
                      </tr>
                    ))
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className="pt-col-date">Total</th>
                    <td />
                    <td />
                    <td>{formatDuration(totals.coupure, 'total')}</td>
                    <td>{formatDuration(totals.total, 'total')}</td>
                    <td className="pt-strong">{formatDuration(totals.worked, 'total')}</td>
                    <td>{formatDuration(totals.nuit, 'total')}</td>
                    <td>{formatDuration(totals.liaison, 'total')}</td>
                    <td>{formatDuration(totals.standby, 'total')}</td>
                    <td className="pt-col-text" />
                    <td>{totals.nuitees}</td>
                    <td className="pt-col-text pt-col-remark" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <SummaryPanel totals={totals} taux={feuille?.taux ?? null} ready={Boolean(feuille)} />
        </div>
      )}

      {editing && (
        <Modal title={`${editing.pointage ? 'Modifier' : 'Saisir'} le pointage du ${formatDate(fromInputValue(editing.date) ?? new Date())}`} onClose={() => setEditing(null)}>
          {saveError && <div className="pt-alert" role="alert">{saveError}</div>}
          <PointageForm
            initial={editing.pointage}
            defaults={{ IDPERSONNELS: personnelId, Date_application: editing.date }}
            personnel={personnel}
            statuts={statuts}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function PointageCells({ pointage: p }: { pointage: PointageFeuille }) {
  const color = windevColorToHex(p.TypeStatut?.CouleurStatut)
  const duration = (minutes: number) => (minutes > 0 ? formatDuration(minutes) : <span className="pt-zero">—</span>)
  // Fin le lendemain du début (travail de nuit).
  const nextDay = p.Date_heure_debut && p.Date_heure_fin && !isSameDay(new Date(p.Date_heure_debut), new Date(p.Date_heure_fin))
  return (
    <>
      <td>{clockTime(p.Date_heure_debut) || <span className="pt-zero">—</span>}</td>
      <td>
        {clockTime(p.Date_heure_fin) || <span className="pt-zero">—</span>}
        {nextDay && <sup className="pt-next-day" title="Le lendemain">+1</sup>}
      </td>
      <td>{duration(timeMinutes(p.Heure_coupure))}</td>
      <td>{duration(totalMinutes(p))}</td>
      <td className="pt-strong">{duration(workedMinutes(p))}</td>
      <td>{duration(timeMinutes(p.Heure_nuit))}</td>
      <td>{duration(timeMinutes(p.Heure_liaison))}</td>
      <td>{duration(timeMinutes(p.Heure_Stanby))}</td>
      <td className="pt-col-text">
        {p.TypeStatut?.Libelle_generique && (
          <span className="pt-status" style={color ? ({ '--status': color } as CSSProperties) : undefined}>
            {p.TypeStatut.Libelle_generique}
          </span>
        )}
      </td>
      <td>{p.Nuitee === 1 ? <span className="pt-check" aria-label="Nuitée">✓</span> : null}</td>
      <td className="pt-col-text pt-col-remark" title={p.Remarque ?? undefined}>{p.Remarque}</td>
    </>
  )
}

function BlankCells() {
  return (
    <>
      <td colSpan={10} className="pt-blank" />
      <td className="pt-col-text pt-col-remark">
        <span className="pt-add">+ Saisir</span>
      </td>
    </>
  )
}

function SummaryPanel({ totals, taux, ready }: { totals: SheetTotals; taux: TauxHoraire | null; ready: boolean }) {
  const amounts = computeAmounts(totals, taux)
  const money = (value: string | null | undefined) => formatMoney(Number(value ?? 0) || 0)
  return (
    <aside className="pt-summary" aria-label="Récapitulatif de la période">
      <section className="pt-card">
        <h3 className="pt-card-title">Période</h3>
        <div className="pt-hero">
          <span>Heures travaillées</span>
          <strong>{formatDuration(totals.worked, 'total')}</strong>
        </div>
        <dl className="pt-stats">
          <Stat label="Jours prestés" value={totals.joursPrestes} />
          <Stat label="Nuitées" value={totals.nuitees} />
          <Stat label="Samedis" value={totals.samedis} />
          <Stat label="Heures dimanche" value={formatDuration(totals.heuresDimanche, 'total')} />
          <Stat label="Heures de nuit" value={formatDuration(totals.nuit, 'total')} />
          <Stat label="Standby" value={formatDuration(totals.standby, 'total')} />
        </dl>
      </section>

      <section className="pt-card">
        <h3 className="pt-card-title">Montants</h3>
        {amounts ? (
          <dl className="pt-lines">
            <Line label="Chèques repas" value={formatMoney(amounts.chequeRepas)} />
            <Line label="Nuitées" value={formatMoney(amounts.nuitees)} />
            <Line label="Heures de nuit" value={formatMoney(amounts.heuresNuit)} />
            <Line label="Samedis" value={formatMoney(amounts.samedis)} />
            <Line label="Standby" value={formatMoney(amounts.standby)} />
          </dl>
        ) : (
          <p className="muted">{ready ? 'Aucun taux horaire : renseignez-les dans le contrat de travail du salarié.' : '…'}</p>
        )}
      </section>

      {taux && (
        <section className="pt-card">
          <h3 className="pt-card-title">
            Taux du salarié
            {taux.Date_application && <span className="pt-card-sub">depuis le {formatDate(new Date(taux.Date_application))}</span>}
          </h3>
          <dl className="pt-lines">
            <Line label="Taux horaire" value={money(taux.Taux_horaire)} />
            <Line label="Heure supp." value={money(taux.Taux_horaire_supplementaire)} />
            <Line label="Heure de nuit" value={money(taux.Taux_horaire_nuitee)} />
            <Line label="Nuitée" value={money(taux.Taux_nuitee)} />
            <Line label="Forfait samedi" value={money(taux.Taux_samedi)} />
            <Line label="Chèque repas" value={money(taux.Taux_cheque_repas)} />
            <Line label="Standby" value={money(taux.Taux_stanby)} />
          </dl>
        </section>
      )}
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="pt-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="pt-line">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
