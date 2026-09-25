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
  // Seulement avec le filtre pointId (onglet Contacts de la fiche Point) :
  // le lien du contact avec CE point.
  PointContacts?: { Lien: string | null; Recevoir_Mail_Planning: number | null }[]
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
  Adresse: {
    Adresse1: string | null
    Adresse2: string | null
    Adresse3: string | null
    CP: string | null
    Localite: string | null
    Pays: string | null
    Pays_full_name: string | null
  } | null
  // Du plus ancien au plus récent : le premier est la société principale
  // modifiable dans la fiche (voir ContactForm.tsx).
  SocieteContacts: {
    IDSOCIETES: string | null
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
