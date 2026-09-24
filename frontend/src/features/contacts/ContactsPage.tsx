import { useState } from 'react'
import { useContacts, type Contact, type ContactDetail } from './useContacts.js'
import * as colums from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { ContactForm, type ContactDto } from './ContactForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function ContactsPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { contacts, setContacts, loading, error, refetch, total } = useContacts({ page, pageSize, search, filters: projectionFilters(projection) })
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
      columns={colums.columns}
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
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ContactForm initial={initial} defaultSocieteId={projection?.defaults.IDSOCIETES} societes={societes} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
