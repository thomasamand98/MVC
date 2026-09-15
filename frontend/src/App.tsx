// ===== VIEW =====
// Seul fichier qui affiche quelque chose à l'écran. Elle ne connaît que
// l'API HTTP exposée par le Controller NestJS (backend/src/hello/hello.controller.ts)
// — jamais Prisma, jamais MySQL directement. Montée dans le DOM par main.tsx.
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // État local React : ce que la View affiche à un instant donné.
  const [message, setMessage] = useState<string | null>(null)
  const [numero, setNumero] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  // Au premier affichage du composant, on appelle le Controller backend.
  useEffect(() => {
    fetch('http://localhost:3000/hello') // → HelloController (route GET /hello)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ message: string; numero: number }>
      })
      .then((data) => {
        setMessage(data.message) // déclenche le nouvel affichage
        setNumero(data.numero) // déclenche le nouvel affichage
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: '4rem' }}>
      <h1>{error ? `Erreur: ${error}` : (message ?? 'Chargement...')}</h1>
      {!error && <p>numero : {numero}</p>}
      <p style={{ color: '#666' }}>
        React (View) → NestJS Controller → Service (Model) → Prisma → MySQL
      </p>
    </main>
  )
}

export default App
