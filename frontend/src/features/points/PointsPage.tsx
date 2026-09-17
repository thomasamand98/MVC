import { useState } from 'react'
import { usePoints, type Point, type PointDetail } from './usePoints.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { PointForm, type PointDto } from './PointForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'

const DEFAULT_PAGE_SIZE = 25

export function PointsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { points, setPoints, loading, error, refetch, total } = usePoints({ page, pageSize })
  const { get, create, update, remove } = useApiMutation<PointDto, Point, PointDetail>('points')
  // Chargée ici (une fois, tant que l'onglet Points reste monté) et passée
  // au formulaire pour le sélecteur Société — évite de la recharger à
  // chaque ouverture de la modale (voir PointForm.tsx).
  const { societes } = useSocietes()

  return (
    <CrudPage<Point, PointDto, PointDetail>
      title="Points"
      loadingLabel="Chargement des points..."
      data={points}
      setData={setPoints}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(p) => p.IDPOINTS}
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
      deleteConfirmMessage="Supprimer ce point ?"
      createModalTitle="Nouveau point"
      editModalTitle="Modifier le point"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <PointForm initial={initial} societes={societes} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
