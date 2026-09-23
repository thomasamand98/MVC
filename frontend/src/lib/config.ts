// URL de base de l'API backend. En dev, Vite lit VITE_API_URL depuis
// frontend/.env (ou .env.local) ; en prod, elle est injectée au build par
// l'hébergeur (ex. Railway, Vercel) via une variable d'environnement du
// même nom. Fallback sur le hostname courant + port 3000 si absente,
// pour que ça marche sans config en dev local / accès LAN.
export const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`

// Écran de connexion (auth/LoginPage.tsx). Désactivé tant que la vraie
// authentification n'est pas en place : le front ouvre alors une session
// automatique (voir loginAutomatically dans lib/auth.ts) et le système de
// jetons continue de fonctionner normalement. Mettre VITE_LOGIN_SCREEN=true
// pour réactiver l'écran de connexion.
export const LOGIN_SCREEN_ENABLED = import.meta.env.VITE_LOGIN_SCREEN === 'true'
