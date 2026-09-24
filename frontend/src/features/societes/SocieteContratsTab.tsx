import { useState } from 'react'
import { useContrats, type Contrat, type ContratDetail } from '../contrats/useContrats.js'
import { columns as contratColumns } from '../contrats/colums.js'
import { ContratForm, type ContratDto } from '../contrats/ContratForm.js'
import { useTypesFacture } from '../contrats/useTypesFacture.js'
import { useDocumentTemplates } from '../documents/useDocumentTemplates.js'
import { CrudPage } from '../../components/CrudPage.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from './useSocietes.js'

const DEFAULT_PAGE_SIZE = 25

// Colonnes de la page Contrats, sans Société/N° TVA : toujours la société
// de la fiche ici.
const columns = contratColumns.filter((column) => column.id !== 'societe' && column.id !== 'numero_tva')

type Props = {
  societeId: string
}

// Onglet « Contrats / Offres » de la fiche Société (SocieteForm.tsx) : la
// même table que la page Contrats (recherche, filtres, export, Nouveau/
// Modifier/Supprimer), limitée aux contrats de cette société — « Nouveau »
// ouvre la fiche contrat avec la société déjà sélectionnée.
export function SocieteContratsTab({ societeId }: Props) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { contrats, setContrats, loading, error, refetch, total } = useContrats({ page, pageSize, search, filters: { societeId } })
  const { get, create, update, remove } = useApiMutation<ContratDto, Contrat, ContratDetail>('contrats')
  const { societes } = useSocietes()
  const typesFacture = useTypesFacture()
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
      newRecordScope={`societe:${societeId}`}
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ContratForm
          initial={initial}
          societes={societes}
          typesFacture={typesFacture}
          documentTemplates={documentTemplates}
          defaultSocieteId={societeId}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    />
  )
}
