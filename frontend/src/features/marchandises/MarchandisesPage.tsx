import { useState } from 'react'
import { useMarchandises, type Marchandise, type MarchandiseDetail } from './useMarchandises.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { MarchandiseForm, type MarchandiseDto } from './MarchandiseForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function MarchandisesPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { marchandises, setMarchandises, loading, error, refetch, total } = useMarchandises({ page, pageSize, search, filters: projectionFilters(projection) })
  const { get, create, update, remove } = useApiMutation<MarchandiseDto, Marchandise, MarchandiseDetail>('marchandises')

  return (
    <CrudPage<Marchandise, MarchandiseDto, MarchandiseDetail>
      title="Marchandises"
      loadingLabel="Chargement des marchandises..."
      data={marchandises}
      setData={setMarchandises}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(m) => m.IDMARCHANDISES}
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
      deleteConfirmMessage="Supprimer cette marchandise ?"
      createModalTitle="Nouvelle marchandise"
      editModalTitle="Modifier la marchandise"
      entity="marchandises"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <MarchandiseForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
