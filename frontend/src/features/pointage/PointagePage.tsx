import { useState } from 'react'
import { usePointage, type Pointage, type PointageDetail } from './usePointage.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { PointageForm, type PointageDto } from './PointageForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { usePersonnel } from '../personnel/usePersonnel.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'
import { PointageSheet } from './PointageSheet.js'
import { useTypesStatut } from './useTypesStatut.js'

const DEFAULT_PAGE_SIZE = 25

// Onglet Pointage du menu : feuille de pointage d'un salarié (voir
// PointageSheet.tsx). `projection` : page ouverte en résultat d'une
// projection (voir components/projection/ProjectionProvider.tsx) — reste la
// liste filtrée sur les lignes d'origine, avec son propre en-tête.
export function PointagePage({ projection }: { projection?: ProjectionView } = {}) {
  return projection ? <PointageList projection={projection} /> : <PointageSheet />
}

function PointageList({ projection }: { projection: ProjectionView }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { pointage, setPointage, loading, error, refetch, total } = usePointage({ page, pageSize, search, filters: projectionFilters(projection) })
  const { get, create, update, remove } = useApiMutation<PointageDto, Pointage, PointageDetail>('pointage')
  // Chargée ici (une fois, tant que l'onglet Pointage reste monté) et
  // passée au formulaire pour le sélecteur Personnel — évite de la
  // recharger à chaque ouverture de la modale.
  const { personnel } = usePersonnel()
  const { statuts } = useTypesStatut()

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
        search,
        onSearchChange: (value) => { setSearch(value); setPage(1) },
      }}
      deleteConfirmMessage="Supprimer ce pointage ?"
      createModalTitle="Nouveau pointage"
      editModalTitle="Modifier le pointage"
      entity="pointage"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <PointageForm initial={initial} defaults={projection?.defaults} personnel={personnel} statuts={statuts} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
