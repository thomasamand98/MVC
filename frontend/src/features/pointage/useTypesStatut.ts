import { useEffect, useState } from 'react'
import { apiJson } from '../../lib/api'

// Statut de pointage (table types_statut) tel que renvoyé par
// GET /pointage/statuts (backend/src/pointage/pointage.service.ts →
// getStatuts). Archive / Statut_de_travail sont des codes 0/1.
export type TypeStatut = {
  IDType_Statut: string
  Libelle_generique: string | null
  CouleurStatut: number | null
  Statut_de_travail: number | null
  Archive: number | null
}

// Charge la liste des statuts une fois, au montage de la page qui l'utilise,
// pour la passer au formulaire de pointage (comme la liste du personnel).
export function useTypesStatut() {
  const [statuts, setStatuts] = useState<TypeStatut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiJson<{ statuts: TypeStatut[] }>('pointage/statuts').then(
      (res) => { if (!cancelled) { setStatuts(res.statuts); setLoading(false) } },
      () => { if (!cancelled) setLoading(false) },
    )
    return () => { cancelled = true }
  }, [])

  return { statuts, loading }
}
