import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Societe } from './useSocietes.js'

// Une colonne par champ du model Societe (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Societe>()

export const columns = helper.columns([
  helper.accessor('Nom_societe', { header: 'Nom', filterFn: 'includesString' }),
  helper.accessor('Denomination', { header: 'Dénomination', filterFn: 'includesString' }),
  helper.accessor('TVA', { header: 'N° TVA', filterFn: 'includesString' }),
  helper.accessor('Activite', { header: 'Activité', filterFn: 'includesString' }),
  helper.accessor('Site_web', { header: 'Site web', filterFn: 'includesString' }),
])
