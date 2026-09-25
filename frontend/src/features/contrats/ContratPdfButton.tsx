import { useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import type { DocumentTemplateSummary } from '../documents/types.js'

type Props = {
  contratId: string
  // Modèles de type "CONTRAT" (voir ContratsPage.tsx, chargés une seule fois
  // pour toute la page plutôt qu'à chaque ouverture de fiche — même principe
  // que societes/typesFacture, voir ContratForm.tsx).
  templates: DocumentTemplateSummary[]
}

// Bouton « Voir le PDF » de la fiche contrat : demande au backend de fusionner
// le modèle choisi avec les données du contrat (GET /contrats/:id/pdf, voir
// ContratController) et ouvre le PDF obtenu dans un nouvel onglet. La route
// exige un jeton d'authentification (comme le reste de l'API) qu'un lien
// classique n'enverrait pas — le PDF est donc récupéré via apiFetch (fetch
// authentifié) puis affiché depuis un blob, plutôt qu'un <a href> direct.
//
// L'onglet est ouvert de façon synchrone, avant l'attente réseau : ouvrir une
// fenêtre après un `await` n'est plus considéré comme déclenché par le clic
// par la plupart des navigateurs, qui bloqueraient le popup.
export function ContratPdfButton({ contratId, templates }: Props) {
  const [templateId, setTemplateId] = useState(templates[0]?.IDDOCUMENT_TEMPLATES ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleView() {
    const selected = templateId || templates[0]?.IDDOCUMENT_TEMPLATES
    if (!selected) return
    const preview = window.open('', '_blank')
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`contrats/${contratId}/pdf?templateId=${encodeURIComponent(selected)}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (preview) preview.location.href = url
      else window.open(url, '_blank')
    } catch (err) {
      preview?.close()
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (templates.length === 0) {
    return (
      <span className="contrat-pdf" title="Créez d’abord un modèle de contrat dans Gestion documentaire">
        <button type="button" className="btn" disabled>Voir le PDF</button>
      </span>
    )
  }

  return (
    <span className="contrat-pdf">
      {templates.length > 1 && (
        <select className="control contrat-pdf-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Modèle de document">
          {templates.map((t) => (
            <option key={t.IDDOCUMENT_TEMPLATES} value={t.IDDOCUMENT_TEMPLATES}>{t.Nom}</option>
          ))}
        </select>
      )}
      <button type="button" className="btn" onClick={handleView} disabled={loading}>
        {loading ? 'Génération...' : 'Voir le PDF'}
      </button>
      {error && <span className="contrat-pdf-error">{error}</span>}
    </span>
  )
}
