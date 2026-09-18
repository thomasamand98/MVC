import { useEffect, useState } from 'react'

type ContratRow = {
  IDCONTRATS: string
  Num_contrat: string | null
  Description_projet: string | null
  Date_debut: string | null
  Date_fin: string | null
}

type Props = {
  societeId: string
}

const apiUrl = (path: string) => `http://${window.location.hostname}:3000/${path}`

function toDateLabel(value: string | null): string {
  return value ? value.slice(0, 10) : '—'
}

// Onglet « Contrats / Offres » de la fiche Société (SocieteForm.tsx) —
// lecture seule, les contrats se gèrent depuis leur propre page (menu
// Commercial > Contrats / Offre de prix).
export function SocieteContratsTab({ societeId }: Props) {
  const [contrats, setContrats] = useState<ContratRow[] | null>(null)

  useEffect(() => {
    setContrats(null)
    fetch(apiUrl(`contrats?societeId=${encodeURIComponent(societeId)}`))
      .then((res) => res.json() as Promise<{ contrats: ContratRow[] }>)
      .then((json) => setContrats(json.contrats))
      .catch(() => setContrats([]))
  }, [societeId])

  if (contrats === null) return <p className="societe-tab-loading">Chargement...</p>
  if (contrats.length === 0) return <p className="societe-tab-empty">Aucun contrat lié à cette société.</p>

  return (
    <table className="societe-tab-table">
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Description</th>
          <th>Début</th>
          <th>Fin</th>
        </tr>
      </thead>
      <tbody>
        {contrats.map((c) => (
          <tr key={c.IDCONTRATS}>
            <td>{c.Num_contrat || '—'}</td>
            <td>{c.Description_projet || '—'}</td>
            <td>{toDateLabel(c.Date_debut)}</td>
            <td>{toDateLabel(c.Date_fin)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
