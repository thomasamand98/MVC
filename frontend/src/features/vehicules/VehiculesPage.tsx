import { useState } from 'react'
import { useVehicules, type Vehicule, type VehiculeDetail } from './useVehicules.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { VehiculeForm, type VehiculeDto } from './VehiculeForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'

const DEFAULT_PAGE_SIZE = 25

export function VehiculesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { vehicules, setVehicules, loading, error, refetch, total } = useVehicules({ page, pageSize })
  const { get, create, update, remove } = useApiMutation<VehiculeDto, Vehicule, VehiculeDetail>('vehicules')
  // Chargée ici (une fois, tant que l'onglet Véhicules reste monté) et
  // passée au formulaire pour le sélecteur Société — évite de la
  // recharger à chaque ouverture de la modale (voir VehiculeForm.tsx).
  const { societes } = useSocietes()

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
      }}
      deleteConfirmMessage="Supprimer ce véhicule ?"
      createModalTitle="Nouveau véhicule"
      editModalTitle="Modifier le véhicule"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <VehiculeForm initial={initial} societes={societes} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
