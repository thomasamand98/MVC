// Point d'entrée du frontend : monte le composant App (la View, voir App.tsx)
// dans la balise <div id="root"> de index.html. C'est ce fichier que Vite
// charge en premier (voir index.html → <script src="/src/main.tsx">).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
