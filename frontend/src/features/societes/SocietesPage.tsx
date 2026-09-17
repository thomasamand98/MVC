import { useState } from 'react'
import { useSocietes, type Societe } from './useSocietes.js'
import { columns } from './colums.js'
import { DataTable } from '../../components/DataTable.js'
import { Modal } from '../../components/Modal.js'
import { PageActions } from '../../components/PageActions.js'
import { SocieteForm, type SocieteDto } from './SocieteForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes.
export function SocietesPage() {
  const { societes, setSocietes, loading, error } = useSocietes()
  const { create, update, remove } = useApiMutation<SocieteDto, Societe>('societes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)

  if (loading) return <p>Chargement des sociétés...</p>
  if (error) return <p>Erreur : {error}</p>

  const selected = societes.find((s) => s.IDSOCIETES === selectedId) ?? null

  function handleRowClick(societe: Societe) {
    setSelectedId(societe.IDSOCIETES)
  }

  function handleRowDoubleClick(societe: Societe) {
    setSelectedId(societe.IDSOCIETES)
    setModalMode('edit')
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('Supprimer cette société ?')) return
    await remove(selectedId)
    setSocietes((prev) => prev.filter((s) => s.IDSOCIETES !== selectedId))
    setSelectedId(null)
  }

  async function handleSubmit(dto: SocieteDto) {
    if (modalMode === 'edit' && selectedId) {
      const updated = await update(selectedId, dto)
      setSocietes((prev) => prev.map((s) => (s.IDSOCIETES === selectedId ? updated : s)))
    } else {
      const created = await create(dto)
      setSocietes((prev) => [...prev, created])
    }
    setModalMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Sociétés ({societes.length})</h2>
        <PageActions
          onCreate={() => { setSelectedId(null); setModalMode('create') }}
          onDelete={handleDelete}
          deleteDisabled={!selectedId}
        />
      </div>
      <DataTable
        data={societes}
        columns={columns}
        getRowId={(s) => s.IDSOCIETES}
        selectedRowId={selectedId}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Modifier la société' : 'Nouvelle société'} onClose={() => setModalMode(null)}>
          <SocieteForm initial={modalMode === 'edit' ? selected : null} onSubmit={handleSubmit} onCancel={() => setModalMode(null)} />
        </Modal>
      )}
    </div>
  )
}
