import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Pointage } from './usePointage.js'

// Formate une date ISO (renvoyée par Prisma) en JJ/MM/AAAA, plus lisible.
function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-BE')
}

// Extrait "HH:MM" d'un horodatage ISO — les champs Heure_* sont stockés en
// TIME côté MySQL, renvoyés par Prisma comme un datetime sur une date
// arbitraire (souvent 1970-01-01) : on ignore la partie date pour éviter
// tout décalage de fuseau horaire.
function formatTime(value: string | null): string {
  if (!value) return ''
  return value.slice(11, 16)
}

// Convertit un "HH:MM" en heures décimales.
function parseHours(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

// Différence en heures décimales entre deux horodatages ISO.
function diffHours(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return ms >= 0 ? ms / 3_600_000 : null
}

// Formate un nombre d'heures décimal en "Hh MM".
function formatHours(hours: number | null): string {
  if (hours === null) return ''
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${String(m).padStart(2, '0')}`
}

// H. total/H. travaillé ne sont pas des champs stockés — calculés ici à
// titre d'estimation (total = fin - début ; travaillé = total - coupure,
// sans tenir compte des pauses Debut_pause/Fin_Pause qui ne sont pas dans le
// select léger de la liste). À ajuster si la vraie règle métier diffère.
function computeTotal(row: Pointage): number | null {
  return diffHours(row.Date_heure_debut, row.Date_heure_fin)
}

function computeTravaille(row: Pointage): number | null {
  const total = computeTotal(row)
  if (total === null) return null
  const coupure = row.Heure_coupure ? parseHours(formatTime(row.Heure_coupure)) : 0
  return Math.max(total - coupure, 0)
}

// Une colonne par champ affiché du modèle Pointage (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Pointage>()

export const columns = helper.columns([
  helper.accessor('Date_application', {
    header: 'Date',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor((row) => [row.Personnel?.Nom_Personnel, row.Personnel?.Prenom_Personnel].filter(Boolean).join(' '), {
    id: 'personnel',
    header: 'Personnel',
    filterFn: 'includesString',
  }),
  helper.accessor('Date_heure_debut', {
    header: 'H. début',
    filterFn: 'includesString',
    cell: (info) => formatTime(info.getValue()),
  }),
  helper.accessor('Date_heure_fin', {
    header: 'H. fin',
    filterFn: 'includesString',
    cell: (info) => formatTime(info.getValue()),
  }),
  helper.accessor('Heure_coupure', {
    header: 'H. coupure',
    filterFn: 'includesString',
    cell: (info) => formatTime(info.getValue()),
  }),
  helper.accessor((row) => formatHours(computeTotal(row)), { id: 'h_total', header: 'H. total', filterFn: 'includesString' }),
  helper.accessor((row) => formatHours(computeTravaille(row)), { id: 'h_travaille', header: 'H. travaillé', filterFn: 'includesString' }),
  helper.accessor('Heure_nuit', {
    header: 'H. nuit',
    filterFn: 'includesString',
    cell: (info) => formatTime(info.getValue()),
  }),
  helper.accessor('Heure_liaison', {
    header: 'H. liaison',
    filterFn: 'includesString',
    cell: (info) => formatTime(info.getValue()),
  }),
  helper.accessor('Heure_Stanby', {
    header: 'H. standby',
    filterFn: 'includesString',
    cell: (info) => formatTime(info.getValue()),
  }),
  helper.accessor((row) => row.TypeStatut?.Libelle_generique ?? '', {
    id: 'statut',
    header: 'Statut',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => (row.Nuitee ? 'Oui' : 'Non'), {
    id: 'nuitee',
    header: 'Nuitée',
    filterFn: 'includesString',
  }),
  helper.accessor('Remarque', { header: 'Remarque', filterFn: 'includesString' }),
])
