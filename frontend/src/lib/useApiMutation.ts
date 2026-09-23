import { apiFetch } from './api'

// Envoie une requête d'écriture (create/update/delete) à l'API backend et
// parse la réponse JSON si elle en contient une (DELETE renvoie un corps
// vide côté NestJS, voir *.controller.ts). En cas d'erreur, l'ApiError levée
// (voir lib/errors.ts) porte le message du serveur.
async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

// Crée/modifie/supprime des enregistrements sur l'API backend pour
// `endpoint` (ex. "societes" → POST/PATCH/DELETE /societes, voir
// *.controller.ts côté backend). Partagé par toutes les features sous
// src/features/, à côté de useApiList pour la lecture.
// `TDto` est la forme du formulaire envoyée ; `T` (par défaut égal à TDto)
// est la forme de l'enregistrement renvoyé par l'API — create/update
// renvoient l'enregistrement à jour tel que la liste l'attend, pour que les
// pages puissent l'insérer directement dans leur état local (voir
// <Entite>Page.tsx) sans refaire de GET. `TDetail` (par défaut égal à T) est
// la forme renvoyée par `get`, pour les features dont la fiche détaillée
// (GET /<endpoint>/:id) contient plus de champs que la liste — voir
// ContactsPage.tsx.
export function useApiMutation<TDto, T = TDto, TDetail = T>(endpoint: string) {
  const get = (id: string) => request<TDetail>(`${endpoint}/${id}`, 'GET')
  const create = (dto: TDto) => request<T>(endpoint, 'POST', dto)
  const update = (id: string, dto: Partial<TDto>) => request<T>(`${endpoint}/${id}`, 'PATCH', dto)
  const remove = (id: string) => request<void>(`${endpoint}/${id}`, 'DELETE')
  return { get, create, update, remove }
}
