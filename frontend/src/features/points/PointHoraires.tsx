import { CloseIcon, PlusIcon } from '../../components/FicheLayout.js'

// Plage d'ouverture d'un point (table grilles_horaires, voir
// backend/src/point/point.dto.ts) : Jour_semaine 1 = lundi … 7 = dimanche.
export type Horaire = { Jour_semaine: number; Heure_debut: string; Heure_fin: string }

const JOURS = [
  { jour: 1, court: 'Lun', long: 'Lundi' },
  { jour: 2, court: 'Mar', long: 'Mardi' },
  { jour: 3, court: 'Mer', long: 'Mercredi' },
  { jour: 4, court: 'Jeu', long: 'Jeudi' },
  { jour: 5, court: 'Ven', long: 'Vendredi' },
  { jour: 6, court: 'Sam', long: 'Samedi' },
  { jour: 7, court: 'Dim', long: 'Dimanche' },
]

// Nouvelle plage : 8h-12h, ou à la suite de la dernière du jour.
function nextSlot(daySlots: Horaire[], jour: number): Horaire {
  const last = daySlots.at(-1)
  if (!last) return { Jour_semaine: jour, Heure_debut: '08:00', Heure_fin: '12:00' }
  const [h, m] = last.Heure_fin.split(':').map(Number)
  const start = Math.min(h + 1, 22)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { Jour_semaine: jour, Heure_debut: `${pad(start)}:${pad(m)}`, Heure_fin: `${pad(Math.min(start + 4, 23))}:${pad(m)}` }
}

// Semaine d'ouverture : une colonne par jour, plages éditables sur place.
// Les plages sont gardées dans l'ordre de saisie ; le backend les renvoie
// triées par jour puis par heure de début.
export function PointHoraires({ value, onChange }: { value: Horaire[]; onChange: (horaires: Horaire[]) => void }) {
  const byDay = (jour: number) => value.filter((h) => h.Jour_semaine === jour)

  function update(target: Horaire, patch: Partial<Horaire>) {
    onChange(value.map((h) => (h === target ? { ...h, ...patch } : h)))
  }

  // Reporte les plages du lundi sur mardi → vendredi.
  function copyMondayToWeekdays() {
    const lundi = byDay(1)
    onChange([...value.filter((h) => h.Jour_semaine === 1 || h.Jour_semaine > 5), ...[2, 3, 4, 5].flatMap((jour) => lundi.map((h) => ({ ...h, Jour_semaine: jour })))])
  }

  return (
    <div className="pt-week">
      <div className="pt-week-days">
        {JOURS.map(({ jour, court, long }) => {
          const slots = byDay(jour)
          return (
            <div key={jour} className={`pt-day${slots.length ? '' : ' is-closed'}`} role="group" aria-label={long}>
              <span className="pt-day-name" title={long}>{court}</span>
              {slots.length === 0 && <span className="pt-day-closed">Fermé</span>}
              {slots.map((slot, i) => (
                <div key={i} className="pt-slot">
                  <input type="time" value={slot.Heure_debut} required aria-label={`${long}, début de la plage ${i + 1}`} onChange={(e) => update(slot, { Heure_debut: e.target.value })} />
                  <input
                    type="time"
                    value={slot.Heure_fin}
                    required
                    min={slot.Heure_debut}
                    aria-label={`${long}, fin de la plage ${i + 1}`}
                    onChange={(e) => update(slot, { Heure_fin: e.target.value })}
                  />
                  <button type="button" className="pt-slot-remove" title="Retirer cette plage" aria-label={`Retirer la plage ${i + 1} du ${long.toLowerCase()}`} onClick={() => onChange(value.filter((h) => h !== slot))}>
                    <CloseIcon />
                  </button>
                </div>
              ))}
              <button type="button" className="pt-day-add" onClick={() => onChange([...value, nextSlot(slots, jour)])} aria-label={`Ajouter une plage le ${long.toLowerCase()}`}>
                <PlusIcon /> Plage
              </button>
            </div>
          )
        })}
      </div>
      {byDay(1).length > 0 && (
        <button type="button" className="btn ghost sm pt-week-copy" onClick={copyMondayToWeekdays}>
          Appliquer le lundi à toute la semaine (lun → ven)
        </button>
      )}
    </div>
  )
}
