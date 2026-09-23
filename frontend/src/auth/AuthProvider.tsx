import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './AuthContext.js'
import { LoginPage } from './LoginPage.js'
import {
  login as apiLogin,
  loginAutomatically,
  logout as apiLogout,
  refreshSession,
  setSessionLostHandler,
} from '../lib/auth.js'
import { LOGIN_SCREEN_ENABLED } from '../lib/config.js'

type Status = 'checking' | 'anonymous' | 'authenticated' | 'error'

// Garde d'accès de toute l'application : n'affiche `children` (l'app
// elle-même) qu'une fois la session ouverte. Rendre `children` seulement à
// ce moment évite qu'une page lance ses requêtes avant d'avoir un jeton, et
// remet tout l'état de l'app à zéro à chaque changement de session.
//
// Au chargement, la session est reprise silencieusement grâce au cookie de
// renouvellement. Sans session valide :
// - écran de connexion activé (VITE_LOGIN_SCREEN=true) : LoginPage est affiché ;
// - sinon (par défaut, en attendant la vraie authentification) : une session
//   automatique est ouverte sans rien demander à l'utilisateur. Le système de
//   jetons (JWT, renouvellement, guard côté API) fonctionne à l'identique.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [login, setLogin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    // Session perdue en cours d'utilisation (renouvellement refusé, voir
    // lib/api.ts) : retour à l'état « anonyme », d'où la session est rouverte.
    setSessionLostHandler(() => setStatus('anonymous'))
    refreshSession().then((session) => {
      if (cancelled) return
      if (session) setLogin(session.login)
      setStatus(session ? 'authenticated' : 'anonymous')
    })
    return () => {
      cancelled = true
      setSessionLostHandler(null)
    }
  }, [])

  // Session automatique, seulement quand l'écran de connexion est désactivé.
  useEffect(() => {
    if (LOGIN_SCREEN_ENABLED || status !== 'anonymous') return
    let cancelled = false
    loginAutomatically()
      .then((session) => {
        if (cancelled) return
        setLogin(session.login)
        setStatus('authenticated')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Connexion impossible')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [status])

  const value = useMemo(
    () => ({
      login,
      canSignOut: LOGIN_SCREEN_ENABLED,
      signOut: async () => {
        await apiLogout()
        setStatus('anonymous')
      },
    }),
    [login],
  )

  if (status === 'checking' || (status === 'anonymous' && !LOGIN_SCREEN_ENABLED)) {
    return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Chargement...</p>
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p>Impossible d’ouvrir la session : {error}</p>
        <button type="button" onClick={() => setStatus('anonymous')}>
          Réessayer
        </button>
      </div>
    )
  }

  if (status === 'anonymous') {
    return (
      <LoginPage
        onLogin={async (loginName, password) => {
          const session = await apiLogin(loginName, password)
          setLogin(session.login)
          setStatus('authenticated')
        }}
      />
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
