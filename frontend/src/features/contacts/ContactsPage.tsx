import { useState } from 'react'
import { useContacts, type Contact, type ContactDetail } from './useContacts.js'
import * as colums from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { ContactForm, type ContactDto } from './ContactForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

const DEFAULT_PAGE_SIZE = 25

export function ContactsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { contacts, setContacts, loading, error, refetch, total } = useContacts({ page, pageSize })
  const { get, create, update, remove } = useApiMutation<ContactDto, Contact, ContactDetail>('contacts')

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
      }}
      deleteConfirmMessage="Supprimer ce contact ?"
      createModalTitle="Nouveau contact"
      editModalTitle="Modifier le contact"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ContactForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
