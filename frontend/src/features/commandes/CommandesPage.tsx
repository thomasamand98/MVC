import { useState } from 'react'
import { useCommandes, type Commande } from './useCommandes.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { CommandeForm, type CommandeDto } from './CommandeForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useContrats } from '../contrats/useContrats.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function CommandesPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { commandes, setCommandes, loading, error, refetch, total } = useCommandes({ page, pageSize, search, filters: projectionFilters(projection) })
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
        search,
        onSearchChange: (value) => { setSearch(value); setPage(1) },
      }}
      deleteConfirmMessage="Supprimer cette commande ?"
      createModalTitle="Nouvelle commande"
      editModalTitle="Modifier la commande"
      entity="commandes"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <CommandeForm initial={initial} defaults={projection?.defaults} contrats={contrats} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
