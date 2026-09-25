import { useMemo, useState } from 'react'
import { useVehicules, type Vehicule, type VehiculeDetail } from './useVehicules.js'
import { makeColumns } from './colums.js'
import { useEnumerationLabels } from '../../lib/useEnumerationLabels.js'
import { CrudPage } from '../../components/CrudPage.js'
import { VehiculeForm, type VehiculeDto } from './VehiculeForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function VehiculesPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { vehicules, setVehicules, loading, error, refetch, total } = useVehicules({ page, pageSize, search, filters: projectionFilters(projection) })
  const { get, create, update, remove } = useApiMutation<VehiculeDto, Vehicule, VehiculeDetail>('vehicules')
  // Chargée ici (une fois, tant que l'onglet Véhicules reste monté) et
  // passée au formulaire pour le sélecteur Société — évite de la
  // recharger à chaque ouverture de la modale (voir VehiculeForm.tsx).
  const { societes } = useSocietes()
  const types = useEnumerationLabels('type_vehicule')
  const columns = useMemo(() => makeColumns(types), [types])

  return (
    <CrudPage<Vehicule, VehiculeDto, VehiculeDetail>
      title="Véhicules"
      loadingLabel="Chargement des véhicules..."
      data={vehicules}
      setData={setVehicules}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(v) => v.IDVEHICULES}
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
      deleteConfirmMessage="Supprimer ce véhicule ?"
      createModalTitle="Nouveau véhicule"
      editModalTitle="Modifier le véhicule"
      entity="vehicules"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <VehiculeForm initial={initial} defaults={projection?.defaults} societes={societes} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
