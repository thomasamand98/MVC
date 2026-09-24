export const MINUTE_MS = 60_000
export const DAY_MINUTES = 24 * 60
export const SNAP_MINUTES = 15

export function startOfDay(date: Date | number): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Semaine du lundi au dimanche.
export function startOfWeek(date: Date | number): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export function addDays(date: Date | number, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Jours de `from` à `to` inclus.
export function daysInRange(from: Date, to: Date): Date[] {
  const days: Date[] = []
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) days.push(d)
  return days
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6
}

// Valeur d'un <input type="date"> (YYYY-MM-DD, heure locale).
export function toInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromInputValue(value: string): Date | null {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const dayLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
const dayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const dateShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const formatDayLong = (d: Date | number) => capitalize(dayLong.format(d))
export const formatWeekday = (d: Date | number) => weekday.format(d)
export const formatDayShort = (d: Date | number) => capitalize(dayShort.format(d))
export const formatDate = (d: Date | number) => dateShort.format(d)
export const formatTime = (d: Date | number) => time.format(d)
export const formatMoney = (n: number) => money.format(n)

// Répartit en « couloirs » les éléments qui se chevauchent, pour les afficher
// côte à côte au lieu de les empiler. `lanes` est le nombre de couloirs du
// groupe de chevauchement auquel appartient l'élément.
export function layoutLanes<T extends { id: string; start: number; end: number }>(items: T[]) {
  const result = new Map<string, { lane: number; lanes: number }>()
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end)
  let cluster: { id: string; lane: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    for (const { id, lane } of cluster) result.set(id, { lane, lanes: laneEnds.length })
    cluster = []
    laneEnds = []
    clusterEnd = -Infinity
  }

  for (const item of sorted) {
    if (item.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= item.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.end)
    } else {
      laneEnds[lane] = item.end
    }
    cluster.push({ id: item.id, lane })
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  flush()
  return result
}
