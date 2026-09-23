import { useEffect, useState } from 'react'
import { apiJson } from './api'

// Libellés d'une catégorie d'énumération (voir GET /enumerations?categorie=,
// backend/src/enumeration/enumeration.controller.ts), indexés par `Valeur`
// — pour afficher le libellé d'un code stocké tel quel en base (ex. l'unité
// 2 d'une prestation → « Tonne », catégorie « unite_prestation »). Vide tant
// que le chargement n'est pas terminé ou s'il échoue : l'appelant retombe
// alors sur le code brut.
export function useEnumerationLabels(categorie: string): Record<string, string> {
  const [labels, setLabels] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    apiJson<{ enumerations: { Valeur: string | null; Valeur_affiche: string | null }[] }>(
      `enumerations?categorie=${encodeURIComponent(categorie)}`,
    )
      .then((json) => {
        if (cancelled) return
        const next: Record<string, string> = {}
        for (const e of json.enumerations) {
          if (e.Valeur !== null && e.Valeur_affiche) next[e.Valeur] = e.Valeur_affiche
        }
        setLabels(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [categorie])

  return labels
}
