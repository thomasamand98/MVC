import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Chauffeur } from './useChauffeurs.js'

// Une colonne par champ affiché du modèle Chauffeur (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Chauffeur>()

export const columns = helper.columns([
  helper.accessor('Nom_chauffeur', { header: 'Chauffeur', filterFn: 'includesString' }),
  helper.accessor('Categorie', { header: 'Catégorie', filterFn: 'includesString' }),
  helper.accessor('Telephone', { header: 'Téléphone', filterFn: 'includesString' }),
  helper.accessor((row) => row.Societe?.Nom_societe ?? '', {
    id: 'societe',
    header: 'Société',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => [row.Personnel?.Nom_Personnel, row.Personnel?.Prenom_Personnel].filter(Boolean).join(' '), {
    id: 'lien_personnel',
    header: 'Lien personnel',
    filterFn: 'includesString',
  }),
  helper.accessor((row) => (row.Archive ? 'Oui' : 'Non'), {
    id: 'archive',
    header: 'Archivé',
    filterFn: 'includesString',
  }),
])
