import { useState } from 'react'
import { useChauffeurs, type Chauffeur } from './useChauffeurs.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { ChauffeurForm, type ChauffeurDto } from './ChauffeurForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'
import { usePersonnel } from '../personnel/usePersonnel.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'
import { ArchiveFilter, type ArchiveFilterValue } from '../../components/ArchiveFilter.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function ChauffeursPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  // Non archivés par défaut ; tous en projection, pour ne masquer aucune
  // ligne liée.
  const [archive, setArchive] = useState<ArchiveFilterValue>(projection ? '' : '0')
  const filters = { ...projectionFilters(projection), ...(archive ? { archive } : {}) }
  const { chauffeurs, setChauffeurs, loading, error, refetch, total } = useChauffeurs({ page, pageSize, search, filters })
  const { create, update, remove } = useApiMutation<ChauffeurDto, Chauffeur>('chauffeurs')
  // Chargées ici (une fois, tant que l'onglet Chauffeurs reste monté) et
  // passées au formulaire pour les sélecteurs Entreprise et Lien salarié —
  // évite de les recharger à chaque ouverture de la modale (voir
  // ChauffeurForm.tsx).
  const { societes } = useSocietes()
  const { personnel } = usePersonnel()

  return (
    <CrudPage<Chauffeur, ChauffeurDto>
      title="Chauffeurs"
      loadingLabel="Chargement des chauffeurs..."
      data={chauffeurs}
      setData={setChauffeurs}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(c) => c.IDCHAUFFEURS}
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
      deleteConfirmMessage="Supprimer ce chauffeur ?"
      createModalTitle="Nouveau chauffeur"
      editModalTitle="Modifier le chauffeur"
      entity="chauffeurs"
      heading={projection?.heading}
      toolbarExtra={<ArchiveFilter value={archive} onChange={(value) => { setArchive(value); setPage(1) }} />}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ChauffeurForm initial={initial} defaults={projection?.defaults} societes={societes} personnel={personnel} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
