import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Commande } from './useCommandes.js'

// Formate une date ISO (renvoyée par Prisma) en JJ/MM/AAAA, plus lisible.
function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-BE')
}

// Une colonne par champ affiché du modèle Commande (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Commande>()

export const columns = helper.columns([
  helper.accessor('Date_commande', {
    header: 'Date',
    filterFn: 'includesString',
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor((row) => row.Contrat?.Societe?.Nom_societe ?? '', {
    id: 'client',
    header: 'Client',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Contrat?.Num_contrat ?? '', {
    id: 'contrat',
    header: 'N° contrat',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Prestation?.Marchandise?.Nom_marchandise ?? '', {
    id: 'marchandise',
    header: 'Marchandise',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => row.Prestation?.Unite ?? '', {
    id: 'unite',
    header: 'Unité',
    filterFn: 'includesString',
  }),
  helper.accessor('QT', { header: 'Quantité', filterFn: 'includesString' }),
  helper.accessor('NumRef', { header: 'Référence', filterFn: 'includesString' }),
  helper.accessor('Instruction', { header: 'Instruction', filterFn: 'includesString' }),
])
