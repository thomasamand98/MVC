import { createContext, useContext } from 'react'

export type AuthContextValue = {
  // Identifiant de l'utilisateur connecté.
  login: string
  // Faux tant que l'écran de connexion est désactivé (LOGIN_SCREEN_ENABLED) :
  // se déconnecter rouvrirait aussitôt une session automatique, le bouton
  // n'a alors pas de sens.
  canSignOut: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// Disponible pour tout ce qui est rendu sous AuthProvider, c'est-à-dire
// uniquement une fois la session ouverte (voir AuthProvider.tsx).
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé sous AuthProvider')
  return ctx
}
