import { useApiList, type ApiListPagination } from '../../lib/useApiList.js'

// Forme d'un contact telle que renvoyée par le Controller backend
// (backend/src/contact/contact.controller.ts → GET /contacts), qui reflète
// directement le `contactSelect` de contact.service.ts. IDCONTACTS est un
// BigInt côté Prisma, converti en string côté service pour rester
// sérialisable en JSON. SocieteContacts ne contient qu'un seul élément au
// maximum (voir le `take: 1` du select côté service).
export type Contact = {
  IDCONTACTS: string
  Civilite: string | null
  Nom_contact: string | null
  Prenom_contact: string | null
  Telephone_portable: string | null
  Telephone_fixe: string | null
  E_mail: string | null
  SocieteContacts: {
    Fonction_contact: string | null
    Service_bureau: string | null
    Societe: { Nom_societe: string | null } | null
  }[]
}

// Forme complète d'un contact telle que renvoyée par GET /contacts/:id
// (backend/src/contact/contact.controller.ts), qui reflète directement le
// `contactDetailSelect` de contact.service.ts — tous les champs, plus la
// totalité des rattachements société/point (pas juste le premier comme dans
// `Contact`, utilisé par la liste).
export type ContactDetail = {
  IDCONTACTS: string
  Civilite: string | null
  Nom_contact: string | null
  Prenom_contact: string | null
  Telephone_portable: string | null
  Telephone_fixe: string | null
  Telephone_autre: string | null
  E_mail: string | null
  Remarque: string | null
  Personne_physique: number | null
  Adresse_entreprise: number | null
  description_telephone: string | null
  IDADRESSES: string | null
  Adresse: { Adresse1: string | null; CP: string | null; Localite: string | null } | null
  SocieteContacts: {
    Type_lien: string | null
    Fonction_contact: string | null
    Service_bureau: string | null
    Societe: { Nom_societe: string | null } | null
  }[]
  PointContacts: {
    Lien: string | null
    Recevoir_Mail_Planning: number | null
    Point: { Libelle: string | null } | null
  }[]
}

// Récupère la liste des contacts depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
// `pagination` optionnel : voir ApiListPagination (useApiList.ts).
export function useContacts(pagination?: ApiListPagination) {
  const { data: contacts, setData: setContacts, loading, error, refetch, total } = useApiList<Contact>('contacts', pagination)
  return { contacts, setContacts, loading, error, refetch, total }
}
