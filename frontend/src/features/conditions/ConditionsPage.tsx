import { useMemo, useState } from 'react'
import { useConditions, type Condition } from './useConditions.js'
import { makeColumns } from './colums.js'
import { CrudPage } from '../../components/CrudPage.js'
import { ConditionForm, type ConditionDto } from './ConditionForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useEnumerationLabels } from '../../lib/useEnumerationLabels.js'

const DEFAULT_PAGE_SIZE = 25

export function ConditionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const { conditions, setConditions, loading, error, refetch, total } = useConditions({ page, pageSize, search })
  const typesPrestation = useEnumerationLabels('type_prestation')
  const columns = useMemo(() => makeColumns(typesPrestation), [typesPrestation])
  const { create, update, remove } = useApiMutation<ConditionDto, Condition>('conditions')

  return (
    <CrudPage<Condition, ConditionDto>
      title="Conditions d'exécution"
      loadingLabel="Chargement des conditions..."
      data={conditions}
      setData={setConditions}
      loading={loading}
      error={error}
      columns={columns}
      getRowId={(c) => c.IDCONDITIONS_EXECUTION}
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
      deleteConfirmMessage="Supprimer cette condition d'exécution ?"
      createModalTitle="Nouvelle condition"
      editModalTitle="Modifier la condition"
      renderForm={({ initial, onSubmit, onCancel }) => (
        <ConditionForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
      )}
    />
  )
}
