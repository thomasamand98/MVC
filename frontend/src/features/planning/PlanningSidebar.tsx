import { useState, type CSSProperties, type DragEvent } from 'react'
import { formatDate, formatDayLong, startOfDay } from './dateUtils.js'
import { GripIcon, RouteIcon, SearchIcon, TrashIcon, TruckIcon, UserIcon } from './icons.js'
import type { CommandeEnCours, DechargementEnAttente, DragItem } from './types.js'

type Tab = 'commandes' | 'dechargements'

type Props = {
  commandes: CommandeEnCours[]
  dechargements: DechargementEnAttente[]
  chauffeurNom: (id: string | null) => string | null
  onDragStartItem: (item: DragItem, event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onDeleteDechargement: (id: string) => void
}

const matches = (query: string, ...fields: (string | null)[]) =>
  fields.some((f) => f?.toLowerCase().includes(query))

// Panneau gauche du Planning : les commandes à planifier (QT > QT_planifie)
// et les déchargements en attente. Chaque élément se glisse sur la grille
// pour créer une exécution.
export function PlanningSidebar({ commandes, dechargements, chauffeurNom, onDragStartItem, onDragEnd, onDeleteDechargement }: Props) {
  const [tab, setTab] = useState<Tab>('commandes')
  const [search, setSearch] = useState('')
  const [hidePlanned, setHidePlanned] = useState(false)
  const query = search.trim().toLowerCase()

  const visibleCommandes = commandes
    .filter((c) => !hidePlanned || c.qtPlanifie < c.qt)
    .filter((c) => !query || matches(query, c.client, c.numero, c.marchandise.nom, c.reference, c.depart, c.arrivee))
    .sort((a, b) => (a.date ?? 0) - (b.date ?? 0))
  const visibleDechargements = dechargements
    .filter((d) => !query || matches(query, d.client, d.marchandise.nom, d.reference, d.depart, d.arrivee, d.tracteur, d.remorqueImmat))
    .sort((a, b) => (a.dateChargement ?? 0) - (b.dateChargement ?? 0))

  const totalQt = commandes.reduce((sum, c) => sum + c.qt, 0)
  const totalPlanifie = commandes.reduce((sum, c) => sum + Math.min(c.qtPlanifie, c.qt), 0)

  // Regroupement par date de commande, comme les séparateurs de l'écran WinDev.
  const groups = new Map<number | null, CommandeEnCours[]>()
  for (const c of visibleCommandes) {
    const key = c.date === null ? null : startOfDay(c.date).getTime()
    groups.set(key, [...(groups.get(key) ?? []), c])
  }

  return (
    <aside className="pl-side" aria-label="Éléments à planifier">
      <div className="pl-side-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'commandes'} className={tab === 'commandes' ? 'is-active' : ''} onClick={() => setTab('commandes')}>
          Commandes <span className="pl-count">{commandes.filter((c) => c.qtPlanifie < c.qt).length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'dechargements'} className={tab === 'dechargements' ? 'is-active' : ''} onClick={() => setTab('dechargements')}>
          Déchargements <span className="pl-count">{dechargements.length}</span>
        </button>
      </div>

      <div className="pl-side-tools">
        <label className="pl-search">
          <SearchIcon />
          <input type="search" placeholder="Client, référence, trajet…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {tab === 'commandes' ? (
          <div className="pl-side-summary">
            <span>{totalPlanifie} / {totalQt} planifiés</span>
            <label className="pl-check">
              <input type="checkbox" checked={hidePlanned} onChange={(e) => setHidePlanned(e.target.checked)} />
              Masquer complètes
            </label>
          </div>
        ) : (
          <div className="pl-side-summary">
            <span>En attente de planification</span>
          </div>
        )}
      </div>

      <div className="pl-side-list" role="tabpanel">
        {tab === 'commandes' && (
          <>
            {visibleCommandes.length === 0 && <p className="pl-empty">Aucune commande à afficher.</p>}
            {[...groups].map(([day, items]) => (
              <section key={day ?? 'sans-date'} className="pl-side-group">
                <h3 className="pl-side-date">{day === null ? 'Sans date' : formatDayLong(day)}</h3>
                {items.map((c) => (
                  <CommandeItem key={c.id} commande={c} onDragStartItem={onDragStartItem} onDragEnd={onDragEnd} />
                ))}
              </section>
            ))}
          </>
        )}

        {tab === 'dechargements' && (
          <>
            {visibleDechargements.length === 0 && <p className="pl-empty">Aucun déchargement en attente.</p>}
            {visibleDechargements.map((d) => (
              <div
                key={d.id}
                className="pl-item"
                draggable
                style={{ '--m': d.marchandise.couleur } as CSSProperties}
                onDragStart={(event) => onDragStartItem({ kind: 'dechargement', id: d.id, durationMinutes: d.dureeMinutes, grabOffsetMinutes: 0 }, event)}
                onDragEnd={onDragEnd}
              >
                <GripIcon className="pl-item-grip" />
                <div className="pl-item-body">
                  <div className="pl-item-head">
                    <strong>{d.client}</strong>
                    <button
                      type="button"
                      className="pl-icon-btn pl-icon-btn--danger"
                      aria-label={`Supprimer le déchargement ${d.client}`}
                      title="Supprimer"
                      onClick={() => { if (window.confirm('Supprimer ce déchargement en attente ?')) onDeleteDechargement(d.id) }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="pl-item-goods">
                    <span className="pl-swatch" />
                    {d.marchandise.nom}
                    {d.reference && <span className="pl-muted"> · {d.reference}</span>}
                  </div>
                  <div className="pl-item-line"><RouteIcon /> {d.depart} → {d.arrivee}</div>
                  <div className="pl-item-line">
                    <TruckIcon />
                    {d.tracteur && <span className="pl-plate">{d.tracteur}</span>}
                    {d.remorqueImmat && <span className="pl-plate">{d.remorqueImmat}</span>}
                  </div>
                  <div className="pl-item-line pl-muted">
                    <UserIcon /> {chauffeurNom(d.chauffeurId) ?? 'Non affecté'}{d.dateChargement !== null && ` · chargé le ${formatDate(d.dateChargement)}`}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <p className="pl-side-hint">Glissez un élément sur le planning pour créer une exécution.</p>
    </aside>
  )
}

function CommandeItem({ commande: c, onDragStartItem, onDragEnd }: { commande: CommandeEnCours; onDragStartItem: Props['onDragStartItem']; onDragEnd: () => void }) {
  const complete = c.qtPlanifie >= c.qt
  const ratio = c.qt > 0 ? Math.min(c.qtPlanifie / c.qt, 1) : 1
  return (
    <div
      className={`pl-item${complete ? ' is-complete' : ''}`}
      draggable={!complete}
      title={complete ? 'Commande entièrement planifiée' : 'Glisser sur le planning'}
      style={{ '--m': c.marchandise.couleur } as CSSProperties}
      onDragStart={(event) => onDragStartItem({ kind: 'commande', id: c.id, durationMinutes: c.dureeMinutes, grabOffsetMinutes: 0 }, event)}
      onDragEnd={onDragEnd}
    >
      <GripIcon className="pl-item-grip" />
      <div className="pl-item-body">
        <div className="pl-item-head">
          <strong>{c.client}</strong>
          <span className="pl-qty">{c.qtPlanifie} / {c.qt}</span>
        </div>
        <div className="pl-item-goods">
          <span className="pl-swatch" />
          {c.marchandise.nom}
          {c.reference && <span className="pl-muted"> · {c.reference}</span>}
        </div>
        <div className="pl-item-line"><RouteIcon /> {c.depart} → {c.arrivee}</div>
        <div className="pl-item-foot">
          <span className="pl-mono pl-muted">N° {c.numero}</span>
          <span className="pl-progress" aria-hidden="true"><span style={{ width: `${ratio * 100}%` }} /></span>
        </div>
      </div>
    </div>
  )
}
