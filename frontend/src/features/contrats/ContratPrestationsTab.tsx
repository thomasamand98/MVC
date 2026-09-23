import type { ContratPrestation } from './useContrats.js'
import { formatEuro } from './format.js'
import { useEnumerationLabels } from '../../lib/useEnumerationLabels.js'

type Props = {
  prestations: ContratPrestation[]
}

// Onglet « Prestations » de la fiche contrat (ContratForm.tsx) — lecture
// seule, les prestations viennent avec la fiche (GET /contrats/:id). L'unité
// est un code de la catégorie d'énumération « unite_prestation » : on
// affiche son libellé, ou le code brut tant que les libellés ne sont pas
// chargés.
export function ContratPrestationsTab({ prestations }: Props) {
  const unites = useEnumerationLabels('unite_prestation')

  if (prestations.length === 0) return <p className="contrat-muted">Aucune prestation sur ce contrat.</p>

  return (
    <div className="contrat-table-wrapper">
      <table className="contrat-table">
        <thead>
          <tr>
            <th className="contrat-num">N°</th>
            <th>Description</th>
            <th>Marchandise</th>
            <th className="contrat-num">Prix unitaire</th>
            <th>Unité</th>
          </tr>
        </thead>
        <tbody>
          {prestations.map((p) => (
            <tr key={p.IDPRESTATIONS}>
              <td className="contrat-num" data-label="N°">{p.Ordre ?? '—'}</td>
              <td data-label="Description">{p.Description_prestation || '—'}</td>
              <td data-label="Marchandise">{p.Marchandise?.Nom_marchandise || '—'}</td>
              <td className="contrat-num" data-label="Prix unitaire">{formatEuro(p.Prix_unitaire)}</td>
              <td data-label="Unité">{p.Unite === null ? '—' : (unites[String(p.Unite)] ?? String(p.Unite))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
