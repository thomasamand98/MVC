import { useState } from 'react'
import { useMarchandises, type Marchandise, type MarchandiseDetail } from './useMarchandises.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { MarchandiseForm, type MarchandiseDto } from './MarchandiseForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

const DEFAULT_PAGE_SIZE = 25

export function MarchandisesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { marchandises, setMarchandises, loading, error, refetch, total } = useMarchandises({ page, pageSize })
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
      }}
      deleteConfirmMessage="Supprimer cette marchandise ?"
      createModalTitle="Nouvelle marchandise"
      editModalTitle="Modifier la marchandise"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <MarchandiseForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
