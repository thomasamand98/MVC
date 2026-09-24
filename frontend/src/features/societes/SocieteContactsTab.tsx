import { useState } from 'react'
import { useContacts, type Contact, type ContactDetail } from '../contacts/useContacts.js'
import { columns as contactColumns } from '../contacts/colums.js'
import { ContactForm, type ContactDto } from '../contacts/ContactForm.js'
import { CrudPage } from '../../components/CrudPage.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from './useSocietes.js'

const DEFAULT_PAGE_SIZE = 25

// Colonnes de la page Contacts, sans Société : toujours la société de la
// fiche ici (Fonction/Service affichent le lien avec cette société, voir
// ContactService.getContacts côté backend).
const columns = contactColumns.filter((column) => column.id !== 'societe')

type Props = {
  societeId: string
}

// Onglet « Contacts » de la fiche Société (SocieteForm.tsx) : la même table
// que la page Contacts (recherche, filtres, export, Nouveau/Modifier/
// Supprimer), limitée aux contacts liés à cette société — « Nouveau » crée
// le contact déjà lié à la société.
export function SocieteContactsTab({ societeId }: Props) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { contacts, setContacts, loading, error, refetch, total } = useContacts({ page, pageSize, search, filters: { societeId } })
  const { get, create, update, remove } = useApiMutation<ContactDto, Contact, ContactDetail>('contacts')
  // Pour la liste « Société » de la fiche (voir ContactForm.tsx).
  const { societes } = useSocietes()

  return (
    <CrudPage<Contact, ContactDto, ContactDetail>
      title="Contacts"
      loadingLabel="Chargement des contacts..."
      data={contacts}
      setData={setContacts}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(c) => c.IDCONTACTS}
      create={create}
      update={update}
      remove={remove}
      getDetail={get}
      refetch={refetch}
      pagination={{
        page,
        pageSize,
        total,
        onPageChange: setPage,
        onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
        search,
        onSearchChange: (value) => { setSearch(value); setPage(1) },
      }}
      deleteConfirmMessage="Supprimer ce contact ?"
      createModalTitle="Nouveau contact"
      editModalTitle="Modifier le contact"
      entity="contacts"
      newRecordScope={`societe:${societeId}`}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ContactForm initial={initial} societes={societes} defaultSocieteId={societeId} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
