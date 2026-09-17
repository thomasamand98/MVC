import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un personnel telle que renvoyée par le Controller backend
// (backend/src/personnel/personnel.controller.ts → GET /personnel), qui
// reflète directement le `personnelSelect` de personnel.service.ts.
// IDPERSONNELS est un BigInt côté Prisma, converti en string côté service
// pour rester sérialisable en JSON.
export type Personnel = {
  IDPERSONNELS: string
  Civilite_Personnel: string | null
  Prenom_Personnel: string | null
  Nom_Personnel: string | null
  Telephone_professionnel: string | null
  Telephone_fixe: string | null
  Date_validite_CAP: string | null
  Date_validite_selection_medicale: string | null
  Date_validite_carte_chauffeur: string | null
  Num_service_social: string | null
}

// Forme complète d'un personnel telle que renvoyée par GET /personnel/:id,
// qui reflète directement le `personnelDetailSelect` de personnel.service.ts.
// Routier/Manutention/Atelier sont des codes 0/1 côté vrai modèle Prisma
// (pas des booléens).
export type PersonnelDetail = Personnel & {
  Telephone_portable: string | null
  Telephone_autre: string | null
  Description_telephone: string | null
  E_mail: string | null
  E_mail_professionnel: string | null
  Num_registre_national: string | null
  Date_naissance: string | null
  Lieu_naissance: string | null
  Pays_Naissance: string | null
  Etat_civil: string | null
  Nbr_personne_charge: number | null
  Iban: string | null
  Bic: string | null
  Nom_Banque: string | null
  Qualification: string | null
  Routier: number | null
  Manutention: number | null
  Atelier: number | null
  Commentaire_Personnel: string | null
  IDADRESSES: string | null
  Date_validite_carte_identite: string | null
  Date_validite_A1: string | null
  Date_validite_SIPSI: string | null
}

// Récupère la liste des personnels depuis l'API au montage du composant qui
// l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts). Omis
// (ex. pour le sélecteur Personnel de PointageForm), la liste complète est
// chargée comme avant.
export function usePersonnel(pagination?: ApiListPagination) {
  const { data: personnel, setData: setPersonnel, loading, error, refetch, total } = useApiList<Personnel>('personnel', pagination)
  return { personnel, setPersonnel, loading, error, refetch, total }
}
