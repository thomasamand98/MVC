// ===== VIEW =====
// Point d'entrée visuel de l'app : affiche le menu latéral et la table
// sélectionnée. Chaque item de menu est une feature indépendante sous
// src/features/ (voir layout/AppLayout.tsx pour la liste). Montée dans
// le DOM par main.tsx.
import './App.css'
import { AppLayout } from './layout/AppLayout.js'
import { AuthProvider } from './auth/AuthProvider.js'

// AuthProvider affiche l'écran de connexion tant que l'utilisateur n'est
// pas identifié, puis l'application (voir auth/AuthProvider.tsx).
function App() {
  return (
    <main style={{ width: '100%', maxWidth: '1700px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </main>
  )
}

export default App
