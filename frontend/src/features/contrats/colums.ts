import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Contrat } from './useContrats.js'

// Formate une date ISO (renvoyée par Prisma) en JJ/MM/AAAA, plus lisible.
function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-BE')
}

// Une colonne par champ du model Contrat (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Contrat>()

export const columns = helper.columns([
  helper.accessor('Num_contrat', { header: 'Numéro', filterFn: 'includesString' }),
  helper.accessor((row) => row.Societe?.Nom_societe ?? '', {
    id: 'societe',
    header: 'Société',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Societe?.TVA ?? '', {
    id: 'numero_tva',
    header: 'N° TVA',
    filterFn: 'includesString',
  }),
  helper.accessor('Date_debut', {
    header: 'Début',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Date_fin', {
    header: 'Fin',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Description_projet', { header: 'Description', filterFn: 'includesString' }),
])
