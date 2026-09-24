import { useState } from 'react'
import { useChauffeurs, type Chauffeur } from './useChauffeurs.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { ChauffeurForm, type ChauffeurDto } from './ChauffeurForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function ChauffeursPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { chauffeurs, setChauffeurs, loading, error, refetch, total } = useChauffeurs({ page, pageSize, search, filters: projectionFilters(projection) })
  const { create, update, remove } = useApiMutation<ChauffeurDto, Chauffeur>('chauffeurs')
  // Chargée ici (une fois, tant que l'onglet Chauffeurs reste monté) et
  // passée au formulaire pour le sélecteur Société — évite de la
  // recharger à chaque ouverture de la modale (voir ChauffeurForm.tsx).
  const { societes } = useSocietes()

  return (
    <CrudPage<Chauffeur, ChauffeurDto>
      title="Chauffeurs"
      loadingLabel="Chargement des chauffeurs..."
      data={chauffeurs}
      setData={setChauffeurs}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(c) => c.IDCHAUFFEURS}
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
      deleteConfirmMessage="Supprimer ce chauffeur ?"
      createModalTitle="Nouveau chauffeur"
      editModalTitle="Modifier le chauffeur"
      entity="chauffeurs"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ChauffeurForm initial={initial} defaults={projection?.defaults} societes={societes} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
