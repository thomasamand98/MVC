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

// Condition CMR d'un contrat (ligne « libellé + case à cocher »), telle que
// renvoyée dans la fiche et par POST/PATCH /conditions-cmr (voir
// backend/src/condition-cmr/condition-cmr.service.ts, conditionCmrSelect).
export type ConditionCmr = {
  IDCONDITIONS_CMR: string
  Libelle: string | null
  Boite_a_cocher: number | null
}

// Ligne de l'onglet Prestations de la fiche (lecture seule). Prix_unitaire
// est un Decimal côté Prisma, sérialisé en string. Unite est le code d'une
// valeur de la catégorie d'énumération « unite_prestation ».
export type ContratPrestation = {
  IDPRESTATIONS: string
  Ordre: number | null
  Description_prestation: string | null
  Prix_unitaire: string | null
  Unite: number | null
  Marchandise: { Nom_marchandise: string | null } | null
}

// Ligne de l'onglet Factures de la fiche (lecture seule). Montant_Facture_HT
// est un Decimal côté Prisma, sérialisé en string. etat_Facture est le code
// d'une valeur de la catégorie d'énumération « etat_facture » ; Proformat/
// Note_de_Credit sont des codes 0/1.
export type ContratFacture = {
  IDFACTURES: string
  num_Facture: string | null
  Date_Facture: string | null
  Date_echeance: string | null
  Montant_Facture_HT: string | null
  Taux_TVA: number | null
  etat_Facture: number | null
  Proformat: number | null
  Note_de_Credit: number | null
}

// Forme complète d'un contrat telle que renvoyée par GET /contrats/:id
// (backend/src/contrat/contrat.controller.ts), qui reflète directement le
// `contratDetailSelect` de contrat.service.ts — tous les champs, plus le
// type de facture et la marchandise résolus, le client de la société, les
// listes des onglets de la fiche et le chiffre d'affaires (somme HT des
// factures du contrat, hors proformas ; null s'il n'y en a aucune).
export type ContratDetail = {
  IDCONTRATS: string
  Num_contrat: string | null
  Description_projet: string | null
  Date_debut: string | null
  Date_fin: string | null
  IDSOCIETES: string | null
  Societe: {
    Nom_societe: string | null
    TVA: string | null
    Client: { Numero_client: string | null; Taux_tva: string | null } | null
  } | null
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
  ConditionCmrs: ConditionCmr[]
  Prestations: ContratPrestation[]
  Factures: ContratFacture[]
  Chiffre_affaires: string | null
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
