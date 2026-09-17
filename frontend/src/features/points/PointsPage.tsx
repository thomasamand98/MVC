import { useState } from 'react'
import { usePoints, type Point } from './usePoints.js'
import { columns } from './colums.js'
import { DataTable } from '../../components/DataTable.js'
import { Modal } from '../../components/Modal.js'
import { PageActions } from '../../components/PageActions.js'
import { PointForm, type PointDto } from './PointForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes.
export function PointsPage() {
  const { points, setPoints, loading, error } = usePoints()
  const { create, update, remove } = useApiMutation<PointDto, Point>('points')
  // Chargée ici (une fois, tant que l'onglet Points reste monté) et passée
  // au formulaire pour le sélecteur Société — évite de la recharger à
  // chaque ouverture de la modale (voir PointForm.tsx).
  const { societes } = useSocietes()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)

  if (loading) return <p>Chargement des points...</p>
  if (error) return <p>Erreur : {error}</p>

  const selected = points.find((p) => p.IDPOINTS === selectedId) ?? null

  function handleRowClick(point: Point) {
    setSelectedId(point.IDPOINTS)
  }

  function handleRowDoubleClick(point: Point) {
    setSelectedId(point.IDPOINTS)
    setModalMode('edit')
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('Supprimer ce point ?')) return
    await remove(selectedId)
    setPoints((prev) => prev.filter((p) => p.IDPOINTS !== selectedId))
    setSelectedId(null)
  }

  async function handleSubmit(dto: PointDto) {
    if (modalMode === 'edit' && selectedId) {
      const updated = await update(selectedId, dto)
      setPoints((prev) => prev.map((p) => (p.IDPOINTS === selectedId ? updated : p)))
    } else {
      const created = await create(dto)
      setPoints((prev) => [...prev, created])
    }
    setModalMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Points ({points.length})</h2>
        <PageActions
          onCreate={() => { setSelectedId(null); setModalMode('create') }}
          onDelete={handleDelete}
          deleteDisabled={!selectedId}
        />
      </div>
      <DataTable
        data={points}
        columns={columns}
        getRowId={(p) => p.IDPOINTS}
        selectedRowId={selectedId}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Modifier le point' : 'Nouveau point'} onClose={() => setModalMode(null)}>
          <PointForm
            initial={modalMode === 'edit' ? selected : null}
            societes={societes}
            onSubmit={handleSubmit}
            onCancel={() => setModalMode(null)}
          />
        </Modal>
      )}
    </div>
  )
}
