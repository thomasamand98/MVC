import { API_URL } from './config'
import { ApiError, readErrorMessage } from './errors'

// Session de l'utilisateur. Le jeton d'accès (court, 15 min) n'est gardé
// qu'en mémoire — jamais dans localStorage, lisible par un script injecté.
// Recharger la page le fait disparaître : il est alors redemandé au backend
// grâce au cookie de renouvellement httpOnly (voir refreshSession).
export type Session = { login: string }

let accessToken: string | null = null
let refreshInFlight: Promise<Session | null> | null = null
let sessionLostHandler: (() => void) | null = null

export const getAccessToken = () => accessToken

// Appelé quand la session ne peut plus être renouvelée (voir apiFetch) :
// AuthProvider y branche le retour à l'écran de connexion.
export function setSessionLostHandler(handler: (() => void) | null) {
  sessionLostHandler = handler
}

export function notifySessionLost() {
  accessToken = null
  sessionLostHandler?.()
}

// `credentials: 'include'` : nécessaire pour que le navigateur envoie et
// enregistre le cookie de renouvellement, l'API étant sur une autre origine.
function authRequest(path: 'login' | 'refresh' | 'logout', body?: unknown): Promise<Response> {
  return fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

type SessionResponse = { accessToken: string; login: string }

export async function login(loginName: string, password: string): Promise<Session> {
  let res: Response
  try {
    res = await authRequest('login', { login: loginName, password })
  } catch {
    throw new ApiError('Impossible de joindre le serveur', 0)
  }
  if (!res.ok) throw new ApiError(await readErrorMessage(res), res.status)
  const json = (await res.json()) as SessionResponse
  accessToken = json.accessToken
  return { login: json.login }
}

// Session automatique, utilisée tant que l'écran de connexion est désactivé
// (voir LOGIN_SCREEN_ENABLED dans config.ts). Le backend accepte pour
// l'instant n'importe quel identifiant : ces valeurs sont un simple
// espace réservé, et non de vrais identifiants. À supprimer avec la vraie
// authentification. Plusieurs appels simultanés (ex. double montage en
// développement) partagent une seule connexion, pour ne pas consommer
// inutilement la limite de tentatives.
const AUTO_LOGIN = { login: 'utilisateur', password: 'session-automatique' }
let autoLoginInFlight: Promise<Session> | null = null

export function loginAutomatically(): Promise<Session> {
  autoLoginInFlight ??= login(AUTO_LOGIN.login, AUTO_LOGIN.password).finally(() => {
    autoLoginInFlight = null
  })
  return autoLoginInFlight
}

// Échange le cookie de renouvellement contre un nouveau jeton d'accès.
// Plusieurs appels simultanés (chargement de page, plusieurs requêtes en 401
// en même temps) partagent une seule requête.
export function refreshSession(): Promise<Session | null> {
  refreshInFlight ??= (async () => {
    try {
      const res = await authRequest('refresh')
      if (!res.ok) {
        accessToken = null
        return null
      }
      const json = (await res.json()) as SessionResponse
      accessToken = json.accessToken
      return { login: json.login }
    } catch {
      accessToken = null
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export async function logout(): Promise<void> {
  accessToken = null
  try {
    await authRequest('logout')
  } catch {
    // Serveur injoignable : la session locale est de toute façon terminée.
  }
}
