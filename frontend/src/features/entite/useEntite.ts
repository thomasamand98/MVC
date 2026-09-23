import { useCallback, useEffect, useState } from 'react'
import { apiJson } from '../../lib/api.js'

// Forme de l'entité telle que renvoyée par GET /entite (voir
// backend/src/entite/entite.service.ts, entiteSelect) — ressource
// singleton, contrairement aux autres features sous src/features/ (une
// seule ligne existe dans `entites`, pas de liste ni d'id dans l'URL).
export type EntiteDetail = {
  IDSignaletique: string
  Nom_societe: string | null
  Nom_court: string | null
  Num_Telephone: string | null
  Email_contact: string | null
  Num_TVA: string | null
  Nom_Banque: string | null
  Iban: string | null
  Bic: string | null
  Signataire: string | null
  numero_ucm: string | null
  Num_licence: string | null
  Valeur_facial_cheque_repas: number | null
  Seveur_SMTP: string | null
  Port_SMTP: number | null
  Utilisateur_SMTP: string | null
  // Les mots de passe SMTP ne sont jamais renvoyés par le backend : seulement
  // s'ils sont renseignés (voir EntiteService.getEntite).
  MDP_SMTP_defini: boolean
  TypeConnexion_SMTP: number | null
  Utilisateur_smtp_planning: string | null
  MDP_SMTP_Planning_defini: boolean
  IDADRESSES: string | null
  // Data URI base64 ("data:image/png;base64,...", voir EntiteForm.tsx) —
  // prête à servir directement de `src` d'une <img>, ou null si aucun logo
  // n'a été importé.
  Logo: string | null
  Adresse: {
    Adresse1: string | null
    Adresse2: string | null
    Adresse3: string | null
    CP: string | null
    Localite: string | null
    Pays: string | null
    Pays_full_name: string | null
  } | null
}

// Champs scripturables, mêmes clés que UpdateEntiteDto côté backend
// (backend/src/entite/entite.dto.ts) — les champs d'adresse sont aplatis
// ici (Adresse1/CP/Localite/Pays/Pays_full_name) alors que `EntiteDetail`
// les imbrique sous `Adresse`, pour rester au niveau du formulaire.
export type EntiteDto = {
  Nom_societe: string
  Nom_court: string
  Num_Telephone: string
  Email_contact: string
  Num_TVA: string
  Nom_Banque: string
  Iban: string
  Bic: string
  Signataire: string
  numero_ucm: string
  Num_licence: string
  Valeur_facial_cheque_repas: number
  Seveur_SMTP: string
  Port_SMTP: number
  Utilisateur_SMTP: string
  // Mots de passe SMTP : '' = inchangé (le backend ne remplace la valeur
  // enregistrée que si une nouvelle est envoyée).
  MDP_SMTP: string
  TypeConnexion_SMTP: number
  Utilisateur_smtp_planning: string
  MDP_SMTP_Planning: string
  Adresse1: string
  Adresse2: string
  Adresse3: string
  CP: string
  Localite: string
  Pays: string
  Pays_full_name: string
  // Logo : voir EntiteDetail.Logo. Chaîne vide = supprime le logo
  // (contrairement aux mots de passe SMTP, où vide veut dire « inchangé » —
  // le formulaire connaît toujours le logo actuel, affiché en aperçu).
  Logo: string
}

// Récupère et modifie l'entité (coordonnées de la société courante,
// paramètres bancaires et SMTP) — ressource singleton (GET/PATCH /entite,
// voir backend/src/entite/*), donc écrit ici à la main plutôt que via
// useApiList/useApiMutation qui supposent tous deux une collection
// identifiée par id.
export function useEntite() {
  const [data, setData] = useState<EntiteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return apiJson<EntiteDetail>('entite')
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function update(dto: EntiteDto) {
    const updated = await apiJson<EntiteDetail>('entite', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    setData(updated)
    return updated
  }

  return { data, loading, error, update }
}
