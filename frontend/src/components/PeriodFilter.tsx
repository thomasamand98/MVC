import { addDays, daysInRange, formatWeekday, fromInputValue, toInputValue } from '../features/planning/dateUtils.js'
import { todayPeriod, type Period } from '../lib/period.js'
import { ChevronLeftIcon, ChevronRightIcon } from '../features/planning/icons.js'
import './PeriodFilter.css'

type Props = {
  value: Period
  onChange: (value: Period) => void
}

// Sélecteur « Du … au … » posé à côté du champ Rechercher (prop
// `toolbarExtra` de CrudPage.tsx), sur le modèle de la période du planning
// et de la feuille de pointage : flèches pour passer à la période
// précédente / suivante (de même durée), « Aujourd'hui » et « Toutes ».
// Changer une borne décale l'autre si la période devient inversée.
export function PeriodFilter({ value, onChange }: Props) {
  const from = value ? fromInputValue(value.from) : null
  const to = value ? fromInputValue(value.to) : null

  function changeFrom(raw: string) {
    const date = fromInputValue(raw)
    if (!date) return
    onChange({ from: raw, to: to && to >= date ? value!.to : raw })
  }

  function changeTo(raw: string) {
    const date = fromInputValue(raw)
    if (!date) return
    onChange({ from: from && from <= date ? value!.from : raw, to: raw })
  }

  function shift(direction: -1 | 1) {
    if (!from || !to) return
    const length = daysInRange(from, to).length
    onChange({ from: toInputValue(addDays(from, direction * length)), to: toInputValue(addDays(to, direction * length)) })
  }

  return (
    <div className="period-filter" role="group" aria-label="Période">
      <button type="button" className="icon-btn outlined" onClick={() => shift(-1)} disabled={!value} aria-label="Période précédente">
        <ChevronLeftIcon />
      </button>
      <label className="period-filter-date">
        <span>Du</span>
        {from && <strong>{formatWeekday(from)}</strong>}
        <input type="date" value={value?.from ?? ''} onChange={(e) => changeFrom(e.target.value)} />
      </label>
      <label className="period-filter-date">
        <span>au</span>
        {to && <strong>{formatWeekday(to)}</strong>}
        <input type="date" value={value?.to ?? ''} onChange={(e) => changeTo(e.target.value)} />
      </label>
      <button type="button" className="icon-btn outlined" onClick={() => shift(1)} disabled={!value} aria-label="Période suivante">
        <ChevronRightIcon />
      </button>
      <button type="button" className="btn sm" onClick={() => onChange(todayPeriod())}>Aujourd'hui</button>
      <button type="button" className="btn sm" onClick={() => onChange(null)} aria-pressed={value === null}>Toutes</button>
    </div>
  )
}
