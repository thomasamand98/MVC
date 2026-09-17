import { useState } from 'react'
import { useContacts, type Contact } from './useContacts.js'
import * as colums from './colums.js'
import { DataTable } from '../../components/DataTable.js'
import { Modal } from '../../components/Modal.js'
import { PageActions } from '../../components/PageActions.js'
import { ContactForm, type ContactDto } from './ContactForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes.
export function ContactsPage() {
  const { contacts, setContacts, loading, error } = useContacts()
  const { create, update, remove } = useApiMutation<ContactDto, Contact>('contacts')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)

  if (loading) return <p>Chargement des contacts...</p>
  if (error) return <p>Erreur : {error}</p>

  const selected = contacts.find((c) => c.IDCONTACTS === selectedId) ?? null

  function handleRowClick(contact: Contact) {
    setSelectedId(contact.IDCONTACTS)
  }

  function handleRowDoubleClick(contact: Contact) {
    setSelectedId(contact.IDCONTACTS)
    setModalMode('edit')
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('Supprimer ce contact ?')) return
    await remove(selectedId)
    setContacts((prev) => prev.filter((c) => c.IDCONTACTS !== selectedId))
    setSelectedId(null)
  }

  async function handleSubmit(dto: ContactDto) {
    if (modalMode === 'edit' && selectedId) {
      const updated = await update(selectedId, dto)
      setContacts((prev) => prev.map((c) => (c.IDCONTACTS === selectedId ? updated : c)))
    } else {
      const created = await create(dto)
      setContacts((prev) => [...prev, created])
    }
    setModalMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Contacts ({contacts.length})</h2>
        <PageActions
          onCreate={() => { setSelectedId(null); setModalMode('create') }}
          onDelete={handleDelete}
          deleteDisabled={!selectedId}
        />
      </div>
      <DataTable
        data={contacts}
        columns={colums.columns}
        getRowId={(c) => c.IDCONTACTS}
        selectedRowId={selectedId}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Modifier le contact' : 'Nouveau contact'} onClose={() => setModalMode(null)}>
          <ContactForm initial={modalMode === 'edit' ? selected : null} onSubmit={handleSubmit} onCancel={() => setModalMode(null)} />
        </Modal>
      )}
    </div>
  )
}
