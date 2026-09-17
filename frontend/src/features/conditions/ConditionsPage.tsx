import { useState } from 'react'
import { useConditions, type Condition } from './useConditions.js'
import { columns } from './colums.js'
import { DataTable } from '../../components/DataTable.js'
import { Modal } from '../../components/Modal.js'
import { PageActions } from '../../components/PageActions.js'
import { ConditionForm, type ConditionDto } from './ConditionForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes.
export function ConditionsPage() {
  const { conditions, setConditions, loading, error } = useConditions()
  const { create, update, remove } = useApiMutation<ConditionDto, Condition>('conditions')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)

  if (loading) return <p>Chargement des conditions...</p>
  if (error) return <p>Erreur : {error}</p>

  const selected = conditions.find((c) => c.IDCONDITIONS_EXECUTION === selectedId) ?? null

  function handleRowClick(condition: Condition) {
    setSelectedId(condition.IDCONDITIONS_EXECUTION)
  }

  function handleRowDoubleClick(condition: Condition) {
    setSelectedId(condition.IDCONDITIONS_EXECUTION)
    setModalMode('edit')
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm("Supprimer cette condition d'exécution ?")) return
    await remove(selectedId)
    setConditions((prev) => prev.filter((c) => c.IDCONDITIONS_EXECUTION !== selectedId))
    setSelectedId(null)
  }

  async function handleSubmit(dto: ConditionDto) {
    if (modalMode === 'edit' && selectedId) {
      const updated = await update(selectedId, dto)
      setConditions((prev) => prev.map((c) => (c.IDCONDITIONS_EXECUTION === selectedId ? updated : c)))
    } else {
      const created = await create(dto)
      setConditions((prev) => [...prev, created])
    }
    setModalMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Conditions d'exécution ({conditions.length})</h2>
        <PageActions
          onCreate={() => { setSelectedId(null); setModalMode('create') }}
          onDelete={handleDelete}
          deleteDisabled={!selectedId}
        />
      </div>
      <DataTable
        data={conditions}
        columns={columns}
        getRowId={(c) => c.IDCONDITIONS_EXECUTION}
        selectedRowId={selectedId}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Modifier la condition' : 'Nouvelle condition'} onClose={() => setModalMode(null)}>
          <ConditionForm initial={modalMode === 'edit' ? selected : null} onSubmit={handleSubmit} onCancel={() => setModalMode(null)} />
        </Modal>
      )}
    </div>
  )
}
