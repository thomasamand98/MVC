import { useState } from 'react'
import { usePointage, type Pointage, type PointageDetail } from './usePointage.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { PointageForm, type PointageDto } from './PointageForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { usePersonnel } from '../personnel/usePersonnel.js'

const DEFAULT_PAGE_SIZE = 25

export function PointagePage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { pointage, setPointage, loading, error, refetch, total } = usePointage({ page, pageSize })
  const { get, create, update, remove } = useApiMutation<PointageDto, Pointage, PointageDetail>('pointage')
  // Chargée ici (une fois, tant que l'onglet Pointage reste monté) et
  // passée au formulaire pour le sélecteur Personnel — évite de la
  // recharger à chaque ouverture de la modale.
  const { personnel } = usePersonnel()

  return (
    <CrudPage<Pointage, PointageDto, PointageDetail>
      title="Pointage"
      loadingLabel="Chargement du pointage..."
      data={pointage}
      setData={setPointage}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(p) => p.IDPOINTAGES}
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
      deleteConfirmMessage="Supprimer ce pointage ?"
      createModalTitle="Nouveau pointage"
      editModalTitle="Modifier le pointage"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <PointageForm initial={initial} personnel={personnel} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
