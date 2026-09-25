import { useCallback, useEffect, useState } from 'react'
import { apiFetch, apiJson } from '../../lib/api'

// Taux horaire d'un contrat de travail, tel que renvoyé par
// backend/src/contrat-travail/contrat-travail.service.ts (Decimal Prisma →
// string, ex. "13.400000").
export type TauxHoraire = {
  IDTAUX_HORAIRE: string
  Date_application: string | null
  Taux_horaire: string | null
  Taux_horaire_supplementaire: string | null
  Taux_horaire_nuitee: string | null
  Taux_nuitee: string | null
  Taux_samedi: string | null
  Taux_cheque_repas: string | null
  Taux_stanby: string
}

export type ContratTravail = {
  IDCONTRATS_TRAVAIL: string
  TypeContrat: string | null
  Qualification: string | null
  Date_debut: string | null
  Date_fin: string | null
  Routier: number | null
  Manutention: number | null
  Atelier: number | null
  Societe: { IDSOCIETES: string; Nom_societe: string | null } | null
  // Plus récent en premier.
  TauxHoraireContratTravails: TauxHoraire[]
}

export type TauxHoraireDto = Omit<TauxHoraire, 'IDTAUX_HORAIRE' | 'Date_application'> & {
  IDTAUX_HORAIRE?: string
  Date_application: string
}

// Voir ContratTravailDto côté backend : dates en "AAAA-MM-JJ", `Taux`
// remplace la liste complète des taux du contrat.
export type ContratTravailDto = {
  TypeContrat: string
  Qualification: string
  Date_debut: string
  Date_fin: string
  Routier: number
  Manutention: number
  Atelier: number
  Taux: TauxHoraireDto[]
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Contrats de travail d'un personnel (onglet Contrat de PersonnelForm), plus
// récent en premier. Les écritures remettent la liste à jour localement.
export function useContratsTravail(personnelId: string) {
  const [contrats, setContrats] = useState<ContratTravail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    apiJson<{ contrats: ContratTravail[] }>(`personnel/${personnelId}/contrats-travail`)
      .then((res) => setContrats(res.contrats))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [personnelId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function create(dto: ContratTravailDto) {
    const created = await apiJson<ContratTravail>(`personnel/${personnelId}/contrats-travail`, json('POST', dto))
    setContrats((prev) => sortContrats([created, ...prev]))
  }

  async function update(id: string, dto: ContratTravailDto) {
    const updated = await apiJson<ContratTravail>(`contrats-travail/${id}`, json('PATCH', dto))
    setContrats((prev) => sortContrats(prev.map((c) => (c.IDCONTRATS_TRAVAIL === id ? updated : c))))
  }

  async function remove(id: string) {
    await apiFetch(`contrats-travail/${id}`, { method: 'DELETE' })
    setContrats((prev) => prev.filter((c) => c.IDCONTRATS_TRAVAIL !== id))
  }

  return { contrats, loading, error, refetch, create, update, remove }
}

// Même ordre que le backend : début le plus récent d'abord.
function sortContrats(contrats: ContratTravail[]): ContratTravail[] {
  return [...contrats].sort((a, b) => (b.Date_debut ?? '').localeCompare(a.Date_debut ?? ''))
}
