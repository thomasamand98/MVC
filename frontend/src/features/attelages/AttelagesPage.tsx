import { useState } from 'react'
import { useAttelages, type Attelage } from './useAttelages.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { AttelageForm, type AttelageDto } from './AttelageForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useChauffeurs } from '../chauffeurs/useChauffeurs.js'
import { useVehicules } from '../vehicules/useVehicules.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function AttelagesPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { attelages, setAttelages, loading, error, refetch, total } = useAttelages({ page, pageSize, search, filters: projectionFilters(projection) })
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
        search,
        onSearchChange: (value) => { setSearch(value); setPage(1) },
      }}
      deleteConfirmMessage="Supprimer cet attelage ?"
      createModalTitle="Nouvel attelage"
      editModalTitle="Modifier l'attelage"
      entity="attelages"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <AttelageForm initial={initial} defaults={projection?.defaults} chauffeurs={chauffeurs} vehicules={vehicules} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
