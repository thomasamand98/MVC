import { createColumnHelper } from '@tanstack/react-table'
import { features } from '../../lib/tableFeatures.js'
import type { Contact } from './useContacts.js'

// Une colonne par champ du model Contact (backend/prisma/schema.prisma).
const helper = createColumnHelper<typeof features, Contact>()

// La société/fonction/service viennent de la relation SocieteContacts
// (table de jointure) — on lit le premier élément (voir contact.service.ts).
const societeAccessor = (row: Contact) => row.SocieteContacts[0]?.Societe?.Nom_societe ?? ''
const fonctionAccessor = (row: Contact) => row.SocieteContacts[0]?.Fonction_contact ?? ''
const serviceBureauAccessor = (row: Contact) => row.SocieteContacts[0]?.Service_bureau ?? ''

export const columns = helper.columns([
  helper.accessor('Civilite', { header: 'Civilité', filterFn: 'includesString' }),
  helper.accessor('Nom_contact', { header: 'Nom', filterFn: 'includesString' }),
  helper.accessor('Prenom_contact', { header: 'Prénom', filterFn: 'includesString' }),
  helper.accessor(societeAccessor, { id: 'societe', header: 'Société', filterFn: 'includesString' }),
  helper.accessor(fonctionAccessor, { id: 'fonction', header: 'Fonction', filterFn: 'includesString' }),
  helper.accessor(serviceBureauAccessor, { id: 'service_bureau', header: 'Service / Bureau', filterFn: 'includesString' }),
  helper.accessor('Telephone_portable', { header: 'Portable', filterFn: 'includesString' }),
  helper.accessor('Telephone_fixe', { header: 'Fixe', filterFn: 'includesString' }),
  helper.accessor('E_mail', { header: 'Email', filterFn: 'includesString' }),
])
