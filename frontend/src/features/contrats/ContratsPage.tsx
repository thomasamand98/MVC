import { useState } from 'react'
import { useContrats, type Contrat, type ContratDetail } from './useContrats.js'
import { columns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { ContratForm, type ContratDto } from './ContratForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'
import { useTypesFacture } from './useTypesFacture.js'
import { useDocumentTemplates } from '../documents/useDocumentTemplates.js'
import { projectionFilters, type ProjectionView } from '../../components/projection/relations.js'

const DEFAULT_PAGE_SIZE = 25

// `projection` : page ouverte en résultat d'une projection (voir
// components/projection/ProjectionProvider.tsx) — filtrée sur les lignes
// d'origine, avec son propre en-tête.
export function ContratsPage({ projection }: { projection?: ProjectionView } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { contrats, setContrats, loading, error, refetch, total } = useContrats({ page, pageSize, search, filters: projectionFilters(projection) })
  const { get, create, update, remove } = useApiMutation<ContratDto, Contrat, ContratDetail>('contrats')
  // Chargée ici (une fois, tant que l'onglet Contrats reste monté) et
  // passée au formulaire pour le sélecteur Société — évite de la
  // recharger à chaque ouverture de la modale (voir ContratForm.tsx).
  const { societes } = useSocietes()
  // Idem pour le sélecteur « Type facture ».
  const typesFacture = useTypesFacture()
  // Idem pour le bouton « Voir le PDF » (voir ContratPdfButton.tsx).
  const { templates: documentTemplates } = useDocumentTemplates('CONTRAT')

  return (
    <CrudPage<Contrat, ContratDto, ContratDetail>
      title="Contrats"
      loadingLabel="Chargement des contrats..."
      data={contrats}
      setData={setContrats}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(c) => c.IDCONTRATS}
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
      deleteConfirmMessage="Supprimer ce contrat ?"
      createModalTitle="Nouveau contrat"
      editModalTitle="Modifier le contrat"
      entity="contrats"
      heading={projection?.heading}
      newRecordScope={projection ? `projection:${projection.source}:${projection.ids.join(',')}` : undefined}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ContratForm initial={initial} defaultSocieteId={projection?.defaults.IDSOCIETES} societes={societes} typesFacture={typesFacture} documentTemplates={documentTemplates} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
