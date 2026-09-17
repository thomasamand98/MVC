import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Vehicule } from './useVehicules.js'

// Formate une date ISO (renvoyée par Prisma) en JJ/MM/AAAA, plus lisible.
function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-BE')
}

// Une colonne par champ affiché du modèle Vehicule (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Vehicule>()

export const columns = helper.columns([
  helper.accessor('Num_immat', { header: "N° d'immatriculation", filterFn: 'includesString' }),
  helper.accessor('Type', { header: 'Type', filterFn: 'includesString' }),
  helper.accessor('Marque', { header: 'Marque', filterFn: 'includesString' }),
  helper.accessor('Modele', { header: 'Modèle', filterFn: 'includesString' }),
  helper.accessor((row) => row.Societe?.Nom_societe ?? '', {
    id: 'societe',
    header: 'Société',
    filterFn: 'includesString',
  }),
  helper.accessor('Num_police_assurance', { header: "N° police d'assurance", filterFn: 'includesString' }),
  helper.accessor('Num_chassis', { header: 'N° châssis', filterFn: 'includesString' }),
  helper.accessor('Date_validite_assurance', {
    header: 'Validité assurance',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Num_licence_transport', { header: 'N° licence transport', filterFn: 'includesString' }),
  helper.accessor('Date_validite_licence', {
    header: 'Validité licence',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Date_inspection_auto', {
    header: 'Inspection auto',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor('Date_validite_tachygeaphe', {
    header: 'Validité tachygraphe',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
])
