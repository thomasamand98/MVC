import { useCallback, useEffect, useState } from 'react'
import { apiJson } from '../../lib/api.js'
import type { DocumentTemplateSummary } from './types.js'

// Modèles de document (table document_templates, voir
// backend/src/document-template/). `type` optionnel (ex. "CONTRAT") : ne
// charge que les modèles utilisables pour ce type de document — c'est ce que
// demande la fiche contrat pour son sélecteur « Voir le PDF ».
// Pas de useApiList : la clé de la réponse (`documentTemplates`) ne
// correspond pas au chemin (`document-templates`), comme useTypesFacture.ts.
export function useDocumentTemplates(type?: string) {
  const [templates, setTemplates] = useState<DocumentTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    const query = type ? `?type=${encodeURIComponent(type)}` : ''
    return apiJson<{ documentTemplates: DocumentTemplateSummary[] }>(`document-templates${query}`)
      .then((json) => setTemplates(json.documentTemplates))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [type])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { templates, setTemplates, loading, error, refetch }
}
