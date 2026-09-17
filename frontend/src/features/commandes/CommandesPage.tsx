import { useState } from 'react'
import { useCommandes, type Commande } from './useCommandes.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { CommandeForm, type CommandeDto } from './CommandeForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useContrats } from '../contrats/useContrats.js'

const DEFAULT_PAGE_SIZE = 25

export function CommandesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { commandes, setCommandes, loading, error, refetch, total } = useCommandes({ page, pageSize })
  const { create, update, remove } = useApiMutation<CommandeDto, Commande>('commandes')
  // Chargée ici (une fois, tant que l'onglet Commandes reste monté) et
  // passée au formulaire pour le sélecteur Contrat — évite de la recharger
  // à chaque ouverture de la modale.
  const { contrats } = useContrats()

  return (
    <CrudPage<Commande, CommandeDto>
      title="Commandes"
      loadingLabel="Chargement des commandes..."
      data={commandes}
      setData={setCommandes}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(c) => c.IDCOMMANDES}
      create={create}
      update={update}
      remove={remove}
      refetch={refetch}
      pagination={{
        page,
        pageSize,
        total,
        onPageChange: setPage,
        onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
      }}
      deleteConfirmMessage="Supprimer cette commande ?"
      createModalTitle="Nouvelle commande"
      editModalTitle="Modifier la commande"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <CommandeForm initial={initial} contrats={contrats} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
