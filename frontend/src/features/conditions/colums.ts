import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Condition } from './useConditions.js'

// Affiche un booléen (0/1 en base) en "Oui"/"Non" plutôt qu'en 0/1.
function formatBool(value: number | null): string {
  return value ? 'Oui' : 'Non'
}

// Une colonne par champ du model ConditionExecution (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Condition>()

// `typesPrestation` : libellés de l'énumération « type_prestation » indexés
// par code (voir useEnumerationLabels) — le code brut s'affiche tant qu'ils
// ne sont pas chargés.
export function makeColumns(typesPrestation: Record<string, string>) {
  return helper.columns([
    helper.accessor((c) => (c.Type_Prestation === null ? '' : (typesPrestation[String(c.Type_Prestation)] ?? String(c.Type_Prestation))), {
      id: 'Type_Prestation',
      header: 'Type de prestation',
      filterFn: 'includesString',
    }),
    helper.accessor('Libelle', { header: 'Libellé', filterFn: 'includesString' }),
    helper.accessor('CMR_or_FDR', {
      header: 'CMR / FDR',
      filterFn: 'includesString',
      cell: (info) => formatBool(info.getValue()),
    }),
  ])
}
