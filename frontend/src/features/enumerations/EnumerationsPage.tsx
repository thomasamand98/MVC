import { useState } from 'react'
import {
  sortEnumerations,
  useCategoriesEnumeration,
  useEnumerationsByCategorie,
  type CategorieEnumeration,
  type CategorieEnumerationDto,
  type Enumeration,
  type EnumerationDto,
} from './useEnumerations.js'
import { CategorieEnumerationForm } from './CategorieEnumerationForm.js'
import { EnumerationForm } from './EnumerationForm.js'
import { EditIcon, ListIcon, LockIcon, PlusIcon, SearchIcon, TrashIcon } from './icons.js'
import { Modal } from '../../components/Modal.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import './EnumerationsPage.css'

// Modale ouverte : création, ou modification de l'élément fourni.
type ModalState<T> = { mode: 'create' } | { mode: 'edit'; item: T } | null

// Minuscules sans accents, pour que "etat" retrouve "État de la facture".
function normalize(value: string | null): string {
  return (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'erreur inconnue'
}

// Page "Enumérations" du groupe Configuration : liste des catégories à
// gauche, valeurs de la catégorie sélectionnée à droite (maître/détail).
// Contrairement aux autres <Entite>Page.tsx sous src/features/, pas de
// CrudPage : deux tables liées ne rentrent pas dans son modèle "une table,
// une fiche" — les modales (components/Modal.tsx) sont en revanche les mêmes.
export function EnumerationsPage() {
  const { categories, setCategories, loading, error, refetch } = useCategoriesEnumeration()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [categorySearch, setCategorySearch] = useState('')
  const [valueSearch, setValueSearch] = useState('')
  const [categorieModal, setCategorieModal] = useState<ModalState<CategorieEnumeration>>(null)
  const [enumerationModal, setEnumerationModal] = useState<ModalState<Enumeration>>(null)

  // La sélection retombe sur la première catégorie tant que l'id choisi
  // n'existe pas (premier chargement, ou catégorie supprimée).
  const activeId = categories.some((c) => c.IDCATEGORIES_ENUMERATION === selectedId)
    ? selectedId
    : (categories[0]?.IDCATEGORIES_ENUMERATION ?? null)
  const selected = categories.find((c) => c.IDCATEGORIES_ENUMERATION === activeId) ?? null

  const { enumerations, setEnumerations, loading: loadingValues, error: valuesError, refetch: refetchValues } =
    useEnumerationsByCategorie(activeId)
  const categorieApi = useApiMutation<CategorieEnumerationDto, CategorieEnumeration>('categories-enumeration')
  const enumerationApi = useApiMutation<EnumerationDto, Enumeration>('enumerations')

  const visibleCategories = categories.filter((c) => {
    const query = normalize(categorySearch)
    return normalize(c.Nom_affiche).includes(query) || normalize(c.Nom).includes(query)
  })
  const visibleEnumerations = enumerations.filter((e) => {
    const query = normalize(valueSearch)
    return [e.Valeur_affiche, e.Valeur, e.Valeur_associee].some((field) => normalize(field).includes(query))
  })

  function selectCategory(id: string) {
    setSelectedId(id)
    setValueSearch('')
  }

  // Le nombre de valeurs affiché à côté de la catégorie suit les
  // création/suppression sans recharger la liste des catégories.
  function adjustCount(categorieId: string, delta: number) {
    setCategories((prev) =>
      prev.map((c) =>
        c.IDCATEGORIES_ENUMERATION === categorieId
          ? { ...c, _count: { Enumerations: c._count.Enumerations + delta } }
          : c,
      ),
    )
  }

  async function saveCategorie(dto: CategorieEnumerationDto) {
    try {
      if (categorieModal?.mode === 'edit') {
        const id = categorieModal.item.IDCATEGORIES_ENUMERATION
        const updated = await categorieApi.update(id, dto)
        setCategories((prev) => prev.map((c) => (c.IDCATEGORIES_ENUMERATION === id ? updated : c)))
      } else {
        const created = await categorieApi.create(dto)
        setCategories((prev) => [...prev, created])
        selectCategory(created.IDCATEGORIES_ENUMERATION)
      }
      setCategorieModal(null)
    } catch (err) {
      alert(`Échec de l'enregistrement : ${errorMessage(err)}`)
    }
  }

  async function deleteCategorie(categorie: CategorieEnumeration) {
    if (!confirm(`Supprimer la catégorie « ${categorie.Nom_affiche ?? categorie.Nom} » ?`)) return
    try {
      await categorieApi.remove(categorie.IDCATEGORIES_ENUMERATION)
      setCategories((prev) => prev.filter((c) => c.IDCATEGORIES_ENUMERATION !== categorie.IDCATEGORIES_ENUMERATION))
    } catch (err) {
      alert(`Échec de la suppression : ${errorMessage(err)}`)
    }
  }

  async function saveEnumeration(dto: EnumerationDto) {
    try {
      if (enumerationModal?.mode === 'edit') {
        const id = enumerationModal.item.IDENUMERATIONS
        const updated = await enumerationApi.update(id, dto)
        setEnumerations((prev) => sortEnumerations(prev.map((e) => (e.IDENUMERATIONS === id ? updated : e))))
      } else {
        const created = await enumerationApi.create(dto)
        setEnumerations((prev) => sortEnumerations([...prev, created]))
        adjustCount(dto.IDCATEGORIES_ENUMERATION, 1)
      }
      setEnumerationModal(null)
    } catch (err) {
      alert(`Échec de l'enregistrement : ${errorMessage(err)}`)
    }
  }

  async function deleteEnumeration(enumeration: Enumeration) {
    if (!confirm(`Supprimer la valeur « ${enumeration.Valeur_affiche ?? enumeration.Valeur} » ?`)) return
    try {
      await enumerationApi.remove(enumeration.IDENUMERATIONS)
      setEnumerations((prev) => prev.filter((e) => e.IDENUMERATIONS !== enumeration.IDENUMERATIONS))
      if (activeId) adjustCount(activeId, -1)
    } catch (err) {
      alert(`Échec de la suppression : ${errorMessage(err)}`)
    }
  }

  if (loading) return <p>Chargement des énumérations...</p>
  if (error) {
    return (
      <p>
        Erreur : {error}{' '}
        <button type="button" className="enum-button" onClick={refetch}>
          Réessayer
        </button>
      </p>
    )
  }

  const deleteCategorieBlocker = selected?.Enum_system
    ? 'Une catégorie système ne peut pas être supprimée'
    : selected && selected._count.Enumerations > 0
      ? 'Supprimez d’abord les valeurs de cette catégorie'
      : null
  const nextOrdre = enumerations.reduce((max, e) => Math.max(max, e.Ordre ?? 0), -1) + 1

  return (
    <div className="enum-page">
      <div className="page-header">
        <h2>Énumérations</h2>
        <button type="button" className="enum-button primary" onClick={() => setCategorieModal({ mode: 'create' })}>
          <PlusIcon />
          Nouvelle catégorie
        </button>
      </div>

      <div className="enum-layout">
        <aside className="enum-card enum-categories" aria-label="Catégories">
          <label className="enum-search">
            <SearchIcon />
            <input
              type="search"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Rechercher une catégorie"
              aria-label="Rechercher une catégorie"
            />
          </label>
          <ul className="enum-category-list">
            {visibleCategories.map((c) => (
              <li key={c.IDCATEGORIES_ENUMERATION}>
                <button
                  type="button"
                  className="enum-category"
                  aria-current={c.IDCATEGORIES_ENUMERATION === activeId}
                  onClick={() => selectCategory(c.IDCATEGORIES_ENUMERATION)}
                >
                  <span className="enum-category-text">
                    <span className="enum-category-label">{c.Nom_affiche || c.Nom}</span>
                    <span className="enum-category-name">{c.Nom}</span>
                  </span>
                  {c.Enum_system ? (
                    <span className="enum-lock" title="Catégorie système">
                      <LockIcon />
                    </span>
                  ) : null}
                  <span className="enum-count">{c._count.Enumerations}</span>
                </button>
              </li>
            ))}
            {visibleCategories.length === 0 && <li className="enum-empty-small">Aucune catégorie trouvée</li>}
          </ul>
        </aside>

        <section className="enum-card enum-values" aria-label="Valeurs de la catégorie">
          {selected ? (
            <>
              <header className="enum-values-header">
                <div className="enum-values-title">
                  <h3>{selected.Nom_affiche || selected.Nom}</h3>
                  <span className="enum-category-name">{selected.Nom}</span>
                  {selected.Enum_system ? (
                    <span className="enum-badge">
                      <LockIcon /> Système
                    </span>
                  ) : null}
                </div>
                <div className="enum-values-actions">
                  <button type="button" className="enum-button" onClick={() => setCategorieModal({ mode: 'edit', item: selected })}>
                    <EditIcon />
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="enum-button danger"
                    onClick={() => deleteCategorie(selected)}
                    disabled={deleteCategorieBlocker !== null}
                    title={deleteCategorieBlocker ?? undefined}
                  >
                    <TrashIcon />
                    Supprimer
                  </button>
                  <button type="button" className="enum-button primary" onClick={() => setEnumerationModal({ mode: 'create' })}>
                    <PlusIcon />
                    Nouvelle valeur
                  </button>
                </div>
              </header>

              <label className="enum-search">
                <SearchIcon />
                <input
                  type="search"
                  value={valueSearch}
                  onChange={(e) => setValueSearch(e.target.value)}
                  placeholder="Rechercher une valeur"
                  aria-label="Rechercher une valeur"
                />
              </label>

              {loadingValues ? (
                <p className="enum-empty">Chargement des valeurs...</p>
              ) : valuesError ? (
                <p className="enum-empty">
                  Erreur : {valuesError}{' '}
                  <button type="button" className="enum-button" onClick={refetchValues}>
                    Réessayer
                  </button>
                </p>
              ) : visibleEnumerations.length === 0 ? (
                <div className="enum-empty">
                  <ListIcon />
                  <p>{enumerations.length === 0 ? 'Cette catégorie ne contient encore aucune valeur.' : 'Aucune valeur ne correspond à la recherche.'}</p>
                </div>
              ) : (
                <div className="enum-table-wrapper">
                  <table className="enum-table">
                    <thead>
                      <tr>
                        <th>Valeur affichée</th>
                        <th>Valeur</th>
                        <th>Valeur associée</th>
                        <th className="enum-num">Ordre</th>
                        <th className="enum-check">Système</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEnumerations.map((e) => (
                        <tr key={e.IDENUMERATIONS} onDoubleClick={() => setEnumerationModal({ mode: 'edit', item: e })}>
                          <td className="enum-cell-main" data-label="Valeur affichée">
                            {e.Valeur_affiche}
                          </td>
                          <td data-label="Valeur">{e.Valeur}</td>
                          <td data-label="Valeur associée">{e.Valeur_associee}</td>
                          <td className="enum-num" data-label="Ordre">{e.Ordre}</td>
                          <td className="enum-check" data-label="Système">
                            <input type="checkbox" checked={Boolean(e.Valeur_system)} disabled aria-label="Valeur système" />
                          </td>
                          <td className="enum-row-actions">
                            <button type="button" className="enum-icon-button" onClick={() => setEnumerationModal({ mode: 'edit', item: e })} aria-label="Modifier" title="Modifier">
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="enum-icon-button danger"
                              onClick={() => deleteEnumeration(e)}
                              disabled={Boolean(e.Valeur_system)}
                              aria-label="Supprimer"
                              title={e.Valeur_system ? 'Une valeur système ne peut pas être supprimée' : 'Supprimer'}
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="enum-footer">
                {visibleEnumerations.length} / {enumerations.length} valeur{enumerations.length > 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <div className="enum-empty">
              <ListIcon />
              <p>Aucune catégorie. Créez-en une pour commencer.</p>
            </div>
          )}
        </section>
      </div>

      {categorieModal && (
        <Modal title={categorieModal.mode === 'edit' ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onClose={() => setCategorieModal(null)}>
          <CategorieEnumerationForm
            initial={categorieModal.mode === 'edit' ? categorieModal.item : null}
            onSubmit={saveCategorie}
            onCancel={() => setCategorieModal(null)}
          />
        </Modal>
      )}
      {enumerationModal && activeId && (
        <Modal title={enumerationModal.mode === 'edit' ? 'Modifier la valeur' : 'Nouvelle valeur'} onClose={() => setEnumerationModal(null)}>
          <EnumerationForm
            categorieId={activeId}
            defaultOrdre={nextOrdre}
            initial={enumerationModal.mode === 'edit' ? enumerationModal.item : null}
            onSubmit={saveEnumeration}
            onCancel={() => setEnumerationModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
