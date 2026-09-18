// URL de base de l'API backend. En dev, Vite lit VITE_API_URL depuis
// frontend/.env (ou .env.local) ; en prod, elle est injectée au build par
// l'hébergeur (ex. Railway, Vercel) via une variable d'environnement du
// même nom. Fallback sur le hostname courant + port 3000 si absente,
// pour que ça marche sans config en dev local / accès LAN.
export const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`
