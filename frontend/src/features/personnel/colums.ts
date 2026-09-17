import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Personnel } from './usePersonnel.js'

// Formate une date ISO (renvoyée par Prisma) en JJ/MM/AAAA, plus lisible.
function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-BE')
}

// Une colonne par champ affiché du modèle Personnel (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Personnel>()

export const columns = helper.columns([
  helper.accessor('Civilite_Personnel', { header: 'Civilité', filterFn: 'includesString' }),
  helper.accessor('Prenom_Personnel', { header: 'Prénom', filterFn: 'includesString' }),
  helper.accessor('Nom_Personnel', { header: 'Nom', filterFn: 'includesString' }),
  helper.accessor('Telephone_professionnel', { header: 'Téléphone pro', filterFn: 'includesString' }),
  helper.accessor('Telephone_fixe', { header: 'Téléphone fixe', filterFn: 'includesString' }),
  helper.accessor('Date_validite_CAP', {
    header: 'CAP',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Date_validite_selection_medicale', {
    header: 'Sélection médicale',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Date_validite_carte_chauffeur', {
    header: 'Carte chauffeur',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Num_service_social', { header: 'Code SS', filterFn: 'includesString' }),
])
