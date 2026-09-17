import { useState } from 'react'
import { useMarchandises, type Marchandise } from './useMarchandises.js'
import { columns } from './colums.js'
import { DataTable } from '../../components/DataTable.js'
import { Modal } from '../../components/Modal.js'
import { PageActions } from '../../components/PageActions.js'
import { MarchandiseForm, type MarchandiseDto } from './MarchandiseForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes.
export function MarchandisesPage() {
  const { marchandises, setMarchandises, loading, error } = useMarchandises()
  const { create, update, remove } = useApiMutation<MarchandiseDto, Marchandise>('marchandises')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)

  if (loading) return <p>Chargement des marchandises...</p>
  if (error) return <p>Erreur : {error}</p>

  const selected = marchandises.find((m) => m.IDMARCHANDISES === selectedId) ?? null

  function handleRowClick(marchandise: Marchandise) {
    setSelectedId(marchandise.IDMARCHANDISES)
  }

  function handleRowDoubleClick(marchandise: Marchandise) {
    setSelectedId(marchandise.IDMARCHANDISES)
    setModalMode('edit')
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('Supprimer cette marchandise ?')) return
    await remove(selectedId)
    setMarchandises((prev) => prev.filter((m) => m.IDMARCHANDISES !== selectedId))
    setSelectedId(null)
  }

  async function handleSubmit(dto: MarchandiseDto) {
    if (modalMode === 'edit' && selectedId) {
      const updated = await update(selectedId, dto)
      setMarchandises((prev) => prev.map((m) => (m.IDMARCHANDISES === selectedId ? updated : m)))
    } else {
      const created = await create(dto)
      setMarchandises((prev) => [...prev, created])
    }
    setModalMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Marchandises ({marchandises.length})</h2>
        <PageActions
          onCreate={() => { setSelectedId(null); setModalMode('create') }}
          onDelete={handleDelete}
          deleteDisabled={!selectedId}
        />
      </div>
      <DataTable
        data={marchandises}
        columns={columns}
        getRowId={(m) => m.IDMARCHANDISES}
        selectedRowId={selectedId}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Modifier la marchandise' : 'Nouvelle marchandise'} onClose={() => setModalMode(null)}>
          <MarchandiseForm initial={modalMode === 'edit' ? selected : null} onSubmit={handleSubmit} onCancel={() => setModalMode(null)} />
        </Modal>
      )}
    </div>
  )
}
