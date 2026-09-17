import { useState } from 'react'
import { useContrats, type Contrat } from './useContrats.js'
import { columns } from './colums.js'
import { DataTable } from '../../components/DataTable.js'
import { Modal } from '../../components/Modal.js'
import { PageActions } from '../../components/PageActions.js'
import { ContratForm, type ContratDto } from './ContratForm.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useSocietes } from '../societes/useSocietes.js'

// Assemble le hook (données), le tableau et la modale de création/
// modification/suppression — gère les 3 états possibles : chargement,
// erreur, données prêtes.
export function ContratsPage() {
  const { contrats, setContrats, loading, error } = useContrats()
  const { create, update, remove } = useApiMutation<ContratDto, Contrat>('contrats')
  // Chargée ici (une fois, tant que l'onglet Contrats reste monté) et
  // passée au formulaire pour le sélecteur Société — évite de la
  // recharger à chaque ouverture de la modale (voir ContratForm.tsx).
  const { societes } = useSocietes()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)

  if (loading) return <p>Chargement des contrats...</p>
  if (error) return <p>Erreur : {error}</p>

  const selected = contrats.find((c) => c.IDCONTRATS === selectedId) ?? null

  function handleRowClick(contrat: Contrat) {
    setSelectedId(contrat.IDCONTRATS)
  }

  function handleRowDoubleClick(contrat: Contrat) {
    setSelectedId(contrat.IDCONTRATS)
    setModalMode('edit')
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm('Supprimer ce contrat ?')) return
    await remove(selectedId)
    setContrats((prev) => prev.filter((c) => c.IDCONTRATS !== selectedId))
    setSelectedId(null)
  }

  async function handleSubmit(dto: ContratDto) {
    if (modalMode === 'edit' && selectedId) {
      const updated = await update(selectedId, dto)
      setContrats((prev) => prev.map((c) => (c.IDCONTRATS === selectedId ? updated : c)))
    } else {
      const created = await create(dto)
      setContrats((prev) => [...prev, created])
    }
    setModalMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Contrats ({contrats.length})</h2>
        <PageActions
          onCreate={() => { setSelectedId(null); setModalMode('create') }}
          onDelete={handleDelete}
          deleteDisabled={!selectedId}
        />
      </div>
      <DataTable
        data={contrats}
        columns={columns}
        getRowId={(c) => c.IDCONTRATS}
        selectedRowId={selectedId}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
      />
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Modifier le contrat' : 'Nouveau contrat'} onClose={() => setModalMode(null)}>
          <ContratForm
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
