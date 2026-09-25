import { createElement } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { ColorSwatch } from '../../components/ColorField.js'
import { features } from '../../lib/tableFeatures.js'
import type { Marchandise } from './useMarchandises.js'

// Affiche un booléen (0/1 en base) en "Oui"/"Non" plutôt qu'en 0/1.
function formatBool(value: number | null): string {
  return value ? 'Oui' : 'Non'
}

// Une colonne par champ du model Marchandise (backend/prisma/schema.prisma),
// les colonnes déchet venant de la relation Dechet.
const helper = createColumnHelper<typeof features, Marchandise>()

export const columns = helper.columns([
  helper.accessor('Nom_marchandise', { header: 'Marchandise', filterFn: 'includesString' }),
  helper.accessor((row) => row.Dechet?.Description_dechet ?? '', {
    id: 'dechet',
    header: 'Déchet',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Dechet?.Code ?? '', {
    id: 'code_dechet',
    header: 'Code déchet',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Dechet?.Dangereux ?? null, {
    id: 'dangereux',
    header: 'Dangereux',
    filterFn: 'includesString',
    cell: (info) => formatBool(info.getValue()),
  }),
  helper.accessor((row) => row.Dechet?.Autorisation ?? null, {
    id: 'autorisation',
    header: 'Autorisation',
    filterFn: 'includesString',
    cell: (info) => formatBool(info.getValue()),
  }),
  helper.accessor((row) => row.Dechet?.Inerte ?? null, {
    id: 'interte',
    header: 'Inerte',
    filterFn: 'includesString',
    cell: (info) => formatBool(info.getValue()),
  }),
  helper.accessor((row) => row.Dechet?.Menager ?? null, {
    id: 'menage',
    header: 'Ménage',
    filterFn: 'includesString',
    cell: (info) => formatBool(info.getValue()),
  }),
  helper.accessor('CouleurPlanning', {
    header: 'Couleur',
    enableColumnFilter: false,
    cell: (info) => createElement(ColorSwatch, { value: info.getValue() }),
  }),
])
