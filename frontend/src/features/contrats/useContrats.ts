import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un contrat telle que renvoyée par le Controller backend
// (backend/src/contrat/contrat.controller.ts → GET /contrats), qui reflète
// directement le `contratSelect` de contrat.service.ts. IDCONTRATS est un
// BigInt côté Prisma, converti en string côté service pour rester
// sérialisable en JSON.
export type Contrat = {
  IDCONTRATS: string
  Num_contrat: string | null
  Description_projet: string | null
  Date_debut: string | null
  Date_fin: string | null
  IDSOCIETES: string | null
  Societe: {
    Nom_societe: string | null
    TVA: string | null
  } | null
}

// Forme complète d'un contrat telle que renvoyée par GET /contrats/:id
// (backend/src/contrat/contrat.controller.ts), qui reflète directement le
// `contratDetailSelect` de contrat.service.ts — tous les champs, plus le
// type de facture et la marchandise résolus.
export type ContratDetail = {
  IDCONTRATS: string
  Num_contrat: string | null
  Description_projet: string | null
  Date_debut: string | null
  Date_fin: string | null
  IDSOCIETES: string | null
  Societe: { Nom_societe: string | null; TVA: string | null } | null
  IDTYPES_FACTURE: string | null
  Annee_archivage: string | null
  Offre_de_prix: number | null
  Note_confidentielle: string | null
  Instruction_CMR: string | null
  Version_contrat: string
  Archive: number | null
  Reference_client: string | null
  Taux_tva: string | null
  Qt_client_facturation: number | null
  Suivant: number | null
  IDMARCHANDISES: string | null
  Commissionnaire: string | null
  Type_contrat: string | null
  Marchandise: { Nom_marchandise: string | null } | null
  TypeFacture: { Nom: string | null } | null
}

// Récupère la liste des contrats depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts). Omis
// (ex. pour le sélecteur Contrat de CommandeForm), la liste complète est
// chargée comme avant.
export function useContrats(pagination?: ApiListPagination) {
  const { data: contrats, setData: setContrats, loading, error, refetch, total } = useApiList<Contrat>('contrats', pagination)
  return { contrats, setContrats, loading, error, refetch, total }
}
