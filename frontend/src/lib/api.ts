import { API_URL } from './config'
import { getAccessToken, notifySessionLost, refreshSession } from './auth'
import { ApiError, readErrorMessage } from './errors'

// Point d'appel unique vers l'API backend : préfixe l'URL de base, joint le
// jeton d'accès et lit les messages d'erreur du serveur. `path` est relatif
// à l'API, sans « / » initial (ex. "societes?page=1"). Toutes les features
// sous src/features/ et src/lib/ passent par ici — aucun `fetch` direct.
//
// Sur un 401 (jeton d'accès expiré), la session est renouvelée une fois puis
// la requête rejouée ; si le renouvellement échoue, l'utilisateur est
// renvoyé à l'écran de connexion. Toute réponse non réussie lève une
// ApiError dont le message est celui du serveur.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () => {
    const token = getAccessToken()
    return fetch(`${API_URL}/${path}`, {
      ...init,
      headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  }

  let res = await send()
  if (res.status === 401) {
    if (await refreshSession()) {
      res = await send()
    } else {
      notifySessionLost()
    }
  }
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  return res
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  return (await res.json()) as T
}
