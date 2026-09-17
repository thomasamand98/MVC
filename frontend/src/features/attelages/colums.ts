import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Attelage } from './useAttelages.js'

// Un véhicule lié affiché comme "Marque Modèle (immat)".
function formatVehicule(v: { Marque: string | null; Modele: string | null; Num_immat: string | null } | null): string {
  if (!v) return ''
  return [v.Marque, v.Modele].filter(Boolean).join(' ') + (v.Num_immat ? ` (${v.Num_immat})` : '')
}

// Une colonne par champ affiché du modèle Attelage (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Attelage>()

export const columns = helper.columns([
  helper.accessor((row) => row.Chauffeur?.Nom_chauffeur ?? '', {
    id: 'chauffeur',
    header: 'Chauffeur',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => formatVehicule(row.Tracteur), {
    id: 'tracteur',
    header: 'Tracteur',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => formatVehicule(row.Remorque), {
    id: 'remorque',
    header: 'Remorque',
    filterFn: 'includesString',
  }),
])
