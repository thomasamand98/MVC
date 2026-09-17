import { useApiList } from '../../lib/useApiList.js'

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

// Récupère la liste des contacts depuis l'API au montage du composant
// qui l'utilise (voir lib/useApiList.ts pour la logique fetch partagée).
export function useContacts() {
  const { data: contacts, setData: setContacts, loading, error, refetch } = useApiList<Contact>('contacts')
  return { contacts, setContacts, loading, error, refetch }
}
