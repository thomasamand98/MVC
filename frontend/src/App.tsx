// ===== VIEW =====
// Point d'entrée visuel de l'app : affiche le menu latéral et la table
// sélectionnée. Chaque item de menu est une feature indépendante sous
// src/features/ (voir layout/AppLayout.tsx pour la liste). Montée dans
// le DOM par main.tsx.
import './App.css'
import { AppLayout } from './layout/AppLayout.js'

function App() {
  return (
    <main style={{ width: '100%', maxWidth: '1700px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <AppLayout />
    </main>
  )
}

export default App
