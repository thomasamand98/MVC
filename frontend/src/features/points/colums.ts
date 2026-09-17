import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Point } from './usePoints.js'

// Une colonne par champ du model Point (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Point>()

export const columns = helper.columns([
  helper.accessor('Libelle', { header: 'Nom', filterFn: 'includesString' }),
  helper.accessor('Nom_societe', { header: 'Société', filterFn: 'includesString' }),
  helper.accessor('Telephone', { header: 'Téléphone', filterFn: 'includesString' }),
  helper.accessor((row) => row.Adresse?.Adresse1 ?? '', {
    id: 'adresse_rue',
    header: 'Adresse',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Adresse?.CP ?? '', {
    id: 'code_postal',
    header: 'Code postal',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Adresse?.Localite ?? '', {
    id: 'localite',
    header: 'Localité',
    filterFn: 'includesString',
  }),
])
