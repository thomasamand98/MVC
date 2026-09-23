import { useEffect, useState } from 'react'
import { apiJson } from '../../lib/api.js'

// Type de facture tel que renvoyé par GET /types-facture (voir
// backend/src/type-facture/type-facture.service.ts). IDTYPES_FACTURE est un
// BigInt côté Prisma, converti en string côté service.
export type TypeFacture = {
  IDTYPES_FACTURE: string
  Nom: string | null
}

// Charge les types de facture pour le sélecteur « Type facture » de la fiche
// contrat. Pas de useApiList : la clé de la réponse (`typesFacture`) ne
// correspond pas au chemin (`types-facture`). Liste vide si le chargement
// échoue — le sélecteur ne propose alors que « — ».
export function useTypesFacture(): TypeFacture[] {
  const [typesFacture, setTypesFacture] = useState<TypeFacture[]>([])

  useEffect(() => {
    apiJson<{ typesFacture: TypeFacture[] }>('types-facture')
      .then((json) => setTypesFacture(json.typesFacture))
      .catch(() => {})
  }, [])

  return typesFacture
}
