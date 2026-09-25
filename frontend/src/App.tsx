// ===== VIEW =====
// Point d'entrée visuel de l'app : affiche le menu latéral et la table
// sélectionnée. Chaque item de menu est une feature indépendante sous
// src/features/ (voir layout/AppLayout.tsx pour la liste). Montée dans
// le DOM par main.tsx.
import { AppLayout } from './layout/AppLayout.js'
import { AuthProvider } from './auth/AuthProvider.js'
import { UnsavedChangesProvider } from './components/unsaved-changes/UnsavedChangesProvider.js'

// AuthProvider affiche l'écran de connexion tant que l'utilisateur n'est
// pas identifié, puis l'application (voir auth/AuthProvider.tsx).
// UnsavedChangesProvider : demande « Enregistrer / Annuler les
// modifications » dès qu'on quitte une saisie modifiée, partout dans
// l'application (voir components/unsaved-changes/).
function App() {
  return (
    <main className="app-shell">
      <AuthProvider>
        <UnsavedChangesProvider>
          <AppLayout />
        </UnsavedChangesProvider>
      </AuthProvider>
    </main>
  )
}

export default App
