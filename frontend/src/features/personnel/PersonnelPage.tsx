import { useState } from 'react'
import { usePersonnel, type Personnel, type PersonnelDetail } from './usePersonnel.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { PersonnelForm, type PersonnelDto } from './PersonnelForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

const DEFAULT_PAGE_SIZE = 25

export function PersonnelPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { personnel, setPersonnel, loading, error, refetch, total } = usePersonnel({ page, pageSize })
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
      }}
      deleteConfirmMessage="Supprimer ce personnel ?"
      createModalTitle="Nouveau personnel"
      editModalTitle="Modifier le personnel"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <PersonnelForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
