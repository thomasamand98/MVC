import { useState } from 'react'
import { useAttelages, type Attelage } from './useAttelages.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { AttelageForm, type AttelageDto } from './AttelageForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useChauffeurs } from '../chauffeurs/useChauffeurs.js'
import { useVehicules } from '../vehicules/useVehicules.js'

const DEFAULT_PAGE_SIZE = 25

export function AttelagesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { attelages, setAttelages, loading, error, refetch, total } = useAttelages({ page, pageSize })
  const { create, update, remove } = useApiMutation<AttelageDto, Attelage>('attelages')
  // Chargées ici (une fois, tant que l'onglet Attelages reste monté) et
  // passées au formulaire pour les sélecteurs Chauffeur/Tracteur/Remorque —
  // évite de les recharger à chaque ouverture de la modale.
  const { chauffeurs } = useChauffeurs()
  const { vehicules } = useVehicules()

  return (
    <CrudPage<Attelage, AttelageDto>
      title="Attelages"
      loadingLabel="Chargement des attelages..."
      data={attelages}
      setData={setAttelages}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(a) => a.IDATTELAGE}
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
      }}
      deleteConfirmMessage="Supprimer cet attelage ?"
      createModalTitle="Nouvel attelage"
      editModalTitle="Modifier l'attelage"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <AttelageForm initial={initial} chauffeurs={chauffeurs} vehicules={vehicules} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
