import './ArchiveFilter.css'

// Valeur du paramètre ?archive= côté backend (voir parseArchive,
// backend/src/common/params.ts) : '0' non archivés, '1' archivés, '' tous.
export type ArchiveFilterValue = '0' | '1' | ''

// Sélecteur « Actifs / Archivés / Tous » posé à côté du champ Rechercher
// (prop `toolbarExtra` de CrudPage.tsx).
export function ArchiveFilter({ value, onChange }: { value: ArchiveFilterValue; onChange: (value: ArchiveFilterValue) => void }) {
  return (
    <select className="archive-filter" value={value} onChange={(e) => onChange(e.target.value as ArchiveFilterValue)} aria-label="Filtrer sur l'archivage">
      <option value="0">Non archivés</option>
      <option value="1">Archivés</option>
      <option value="">Tous</option>
    </select>
  )
}
