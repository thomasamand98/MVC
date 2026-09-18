import { useState } from 'react'
import { useSocietes, type Societe, type SocieteDetail } from './useSocietes.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { SocieteForm, type SocieteDto } from './SocieteForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useContacts } from '../contacts/useContacts.js'

const DEFAULT_PAGE_SIZE = 25

export function SocietesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { societes, setSocietes, loading, error, refetch, total } = useSocietes({ page, pageSize })
  const { get, create, update, remove } = useApiMutation<SocieteDto, Societe, SocieteDetail>('societes')
  // Chargée ici (une fois, tant que l'onglet Sociétés reste monté) et
  // passée au formulaire pour les sélecteurs « Contact pour la
  // comptabilité »/« Contact planning » des sous-onglets Client/Fournisseur
  // — évite de la recharger à chaque ouverture de la modale (voir
  // SocieteForm.tsx).
  const { contacts } = useContacts()

  return (
    <CrudPage<Societe, SocieteDto, SocieteDetail>
      title="Sociétés"
      loadingLabel="Chargement des sociétés..."
      data={societes}
      setData={setSocietes}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(s) => s.IDSOCIETES}
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
      deleteConfirmMessage="Supprimer cette société ?"
      createModalTitle="Nouvelle société"
      editModalTitle="Modifier la société"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <SocieteForm initial={initial} contacts={contacts} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
