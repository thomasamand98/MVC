import type { ContratFacture } from './useContrats.js'
import { formatDate, formatEuro } from './format.js'
import { useEnumerationLabels } from '../../lib/useEnumerationLabels.js'

type Props = {
  factures: ContratFacture[]
}

// Onglet « Factures » de la fiche contrat (ContratForm.tsx) — lecture seule,
// les factures viennent avec la fiche (GET /contrats/:id). L'état est un code
// de la catégorie d'énumération « etat_facture » : on affiche son libellé, ou
// le code brut tant que les libellés ne sont pas chargés.
export function ContratFacturesTab({ factures }: Props) {
  const etats = useEnumerationLabels('etat_facture')

  if (factures.length === 0) return <p className="muted">Aucune facture sur ce contrat.</p>

  return (
    <div className="contrat-table-wrapper">
      <table className="contrat-table">
        <thead>
          <tr>
            <th>N° facture</th>
            <th>Date</th>
            <th>Échéance</th>
            <th className="contrat-num">Montant HT</th>
            <th className="contrat-num">TVA</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((f) => (
            <tr key={f.IDFACTURES}>
              <td className="contrat-nowrap" data-label="N° facture">{f.num_Facture || '—'}</td>
              <td className="contrat-nowrap" data-label="Date">{formatDate(f.Date_Facture)}</td>
              <td className="contrat-nowrap" data-label="Échéance">{formatDate(f.Date_echeance)}</td>
              <td className="contrat-num" data-label="Montant HT">{formatEuro(f.Montant_Facture_HT)}</td>
              <td className="contrat-num" data-label="TVA">{f.Taux_TVA === null ? '—' : `${f.Taux_TVA} %`}</td>
              <td data-label="État">
                {f.etat_Facture === null ? '—' : (etats[String(f.etat_Facture)] ?? String(f.etat_Facture))}
                {f.Proformat ? <span className="contrat-badge">Proforma</span> : null}
                {f.Note_de_Credit ? <span className="contrat-badge">Note de crédit</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
