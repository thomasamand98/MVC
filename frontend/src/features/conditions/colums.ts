import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Condition } from './useConditions.js'

// Affiche un booléen (0/1 en base) en "Oui"/"Non" plutôt qu'en 0/1.
function formatBool(value: number | null): string {
  return value ? 'Oui' : 'Non'
}

// Une colonne par champ du model ConditionExecution (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Condition>()

export const columns = helper.columns([
  helper.accessor('Type_Prestation', { header: 'Type de prestation', filterFn: 'includesString' }),
  helper.accessor('Libelle', { header: 'Libellé', filterFn: 'includesString' }),
  helper.accessor('CMR_or_FDR', {
    header: 'CMR / FDR',
    filterFn: 'includesString',
    cell: (info) => formatBool(info.getValue()),
  }),
])
