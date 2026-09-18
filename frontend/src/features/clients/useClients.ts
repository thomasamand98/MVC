import { useApiList } from '../../lib/useApiList.js'

// Forme d'un client telle que renvoyée par le Controller backend
// (backend/src/client/client.controller.ts → GET /clients), qui reflète
// directement le `select` de client.service.ts. IDCLIENTS est un BigInt
// côté Prisma, converti en string côté service pour rester sérialisable en
// JSON.
export type Client = {
  IDCLIENTS: string
  Numero_client: string | null
}

// Récupère la liste complète des clients — table de référence courte (même
// rôle que useSocietes pour les sélecteurs Société de ContratForm/
// PointForm/...), utilisée par les sélecteurs "Client" (ex. IDCLIENTS de
// SocieteForm.tsx). Pas de pagination : la liste entière alimente le menu
// déroulant.
export function useClients() {
  const { data: clients, setData: setClients, loading, error, refetch, total } = useApiList<Client>('clients')
  return { clients, setClients, loading, error, refetch, total }
}
