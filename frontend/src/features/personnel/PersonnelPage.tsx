import { useState } from 'react'
import { usePersonnel, type Personnel, type PersonnelDetail } from './usePersonnel.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { PersonnelForm, type PersonnelDto } from './PersonnelForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function PersonnelPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { personnel, setPersonnel, loading, error, refetch, total } = usePersonnel({ page, pageSize, search, filters: projectionFilters(projection) })
  const { get, create, update, remove } = useApiMutation<PersonnelDto, Personnel, PersonnelDetail>('personnel')

  return (
    <CrudPage<Personnel, PersonnelDto, PersonnelDetail>
      title="Personnel"
      loadingLabel="Chargement du personnel..."
      data={personnel}
      setData={setPersonnel}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(p) => p.IDPERSONNELS}
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
      deleteConfirmMessage="Supprimer ce personnel ?"
      createModalTitle="Nouveau personnel"
      editModalTitle="Modifier le personnel"
      entity="personnel"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <PersonnelForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
