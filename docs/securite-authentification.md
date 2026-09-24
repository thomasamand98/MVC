# Sécurité et authentification

Ce document décrit la protection de l'API : authentification par jeton JWT,
limitation du nombre de requêtes, CORS, en-têtes de sécurité et format des
erreurs. Il explique aussi comment remplacer l'authentification **factice**
actuelle par une vraie.

> ⚠️ **État actuel : la connexion est factice.** `POST /auth/login` accepte
> n'importe quel identifiant et n'importe quel mot de passe, sans consulter la
> base. Quiconque atteint cette route obtient un jeton valide : l'API n'est donc
> pas réellement protégée contre un utilisateur mal intentionné. Le rate limit,
> le CORS et helmet restent utiles, mais la protection ne sera réelle qu'après
> le remplacement décrit dans [Passer à une vraie authentification](#passer-à-une-vraie-authentification).

> ℹ️ **L'écran de connexion est désactivé.** Il reste dans le code
> (`frontend/src/auth/LoginPage.tsx`) mais n'est pas affiché : le front ouvre une
> **session automatique** au chargement. Le système de jetons (JWT, renouvellement,
> guard, rate limit) fonctionne à l'identique, seule la saisie manuelle est retirée.
> Voir [Écran de connexion désactivé](#écran-de-connexion-désactivé-temporaire).

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnement d'une session](#fonctionnement-dune-session)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Écran de connexion désactivé (temporaire)](#écran-de-connexion-désactivé-temporaire)
6. [Variables d'environnement](#variables-denvironnement)
7. [Déploiement (Railway et serveur dédié)](#déploiement)
8. [Passer à une vraie authentification](#passer-à-une-vraie-authentification)
9. [Tester](#tester)
10. [Limites connues et suite](#limites-connues-et-suite)

## Vue d'ensemble

| Protection | Ce qu'elle fait | Où |
|---|---|---|
| **JWT** | Chaque requête doit porter un jeton d'accès valide, sauf la connexion et le renouvellement | `backend/src/auth/` |
| **Rate limit** | 300 requêtes/min/IP, 5 tentatives de connexion/min/IP | `auth.module.ts`, `auth.controller.ts` |
| **CORS** | Seules les origines autorisées lisent les réponses depuis un navigateur | `backend/src/main.ts` |
| **Helmet** | En-têtes de sécurité HTTP, suppression de `X-Powered-By` | `backend/src/main.ts` |
| **Erreurs sobres** | Format unique `{ statusCode, message }`, aucun détail interne | `backend/src/common/all-exceptions.filter.ts` |
| **Secrets masqués** | Les mots de passe SMTP ne sont plus renvoyés par `GET /entite` | `backend/src/entite/entite.service.ts` |

Principe : le **backend est l'autorité**. Le front ne fait que présenter l'écran
de connexion et joindre le jeton ; il ne valide jamais rien lui-même.

## Fonctionnement d'une session

```
 Navigateur (front)                                  API (backend)
 ──────────────────                                  ─────────────
 1. Ouverture de la page
    POST /auth/refresh  (cookie httpOnly)  ───────►  cookie valide ?
                                           ◄───────  200 { accessToken, login }   → app affichée
                                           ◄───────  401                          → écran de connexion

 2. Connexion
    POST /auth/login { login, password }   ───────►  authenticate()
                                           ◄───────  200 { accessToken, login }
                                                     + Set-Cookie: refresh_token (httpOnly, 8 h)

 3. Appels métier
    GET /societes                          ───────►  ThrottlerGuard → JwtAuthGuard
    Authorization: Bearer <accessToken>    ◄───────  200 { ... }

 4. Jeton d'accès expiré (15 min)
    GET /societes                          ───────►  401
    POST /auth/refresh (cookie)            ───────►  nouveau jeton d'accès
    GET /societes (rejeu, transparent)     ───────►  200

 5. Déconnexion
    POST /auth/logout                      ───────►  cookie effacé
```

Deux jetons, deux rôles :

| | Jeton d'accès | Jeton de renouvellement |
|---|---|---|
| Durée | 15 minutes (`ACCESS_TOKEN_TTL_SECONDS`) | 8 heures |
| Où | **En mémoire** dans le front (jamais `localStorage`) | Cookie `httpOnly`, illisible par le JavaScript de la page |
| Envoyé | En-tête `Authorization: Bearer …` | Automatiquement, uniquement vers `/auth/*` |
| Audience (`aud`) | `mvc-template-app` | `mvc-template-refresh` |

Les deux audiences sont distinctes : un jeton de renouvellement ne peut pas servir
de jeton d'accès, et inversement (vérifié par test).

**Contenu du jeton** : uniquement `sub` (l'identifiant), `iat`, `exp`, `iss`
(`mvc-template-api`) et `aud`. Aucune autre donnée n'y circule.

**Rechargement de page** : le jeton d'accès étant en mémoire, il disparaît. Le front
appelle `POST /auth/refresh` au chargement ; le cookie permet de reprendre la
session sans redemander le mot de passe.

## Backend

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/auth/auth.module.ts` | Configure `JwtModule` (HS256) et `ThrottlerModule`, déclare les deux guards globaux dans l'ordre : `ThrottlerGuard` puis `JwtAuthGuard` |
| `src/auth/auth.controller.ts` | Routes `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| `src/auth/auth.service.ts` | `authenticate()` (**factice**), émission et vérification des jetons |
| `src/auth/jwt-auth.guard.ts` | Guard global : exige `Authorization: Bearer <jeton>` sauf route `@Public()` |
| `src/auth/public.decorator.ts` | Décorateur `@Public()` pour ouvrir une route sans jeton |
| `src/auth/auth.config.ts` | Durées, audiences, secret JWT, options du cookie |
| `src/auth/auth.types.ts` | Types `AuthUser` et `AuthenticatedRequest` |
| `src/common/all-exceptions.filter.ts` | Format d'erreur unique |
| `src/main.ts` | helmet, cookie-parser, CORS, confiance dans le proxy |
| `src/app.module.ts` | Importe `AuthModule`, enregistre le filtre d'erreurs |

### Routes d'authentification

| Route | Accès | Corps | Réponse |
|---|---|---|---|
| `POST /auth/login` | Public, **5/min/IP** | `{ login, password }` | `200 { accessToken, login }` + cookie · `400` si champ vide ou trop long · `401` si refusé |
| `POST /auth/refresh` | Public | (cookie) | `200 { accessToken, login }` + cookie prolongé · `401` sans cookie valide |
| `POST /auth/logout` | Public | — | `200 {}` et cookie effacé |
| `GET /auth/me` | Jeton | — | `200 { login }` |

Toute autre route répond `401` sans jeton valide, y compris `GET /contrats/:id/pdf`.

### Guards : ordre et exceptions

`ThrottlerGuard` s'exécute **avant** `JwtAuthGuard` : la limitation freine aussi les
requêtes sans jeton. Pour ouvrir une route sans authentification, la marquer
`@Public()` ; à réserver à la connexion et au renouvellement.

### Rate limit (`@nestjs/throttler`)

- Global : `THROTTLE_LIMIT` requêtes par minute et par IP (300 par défaut).
- Connexion : `LOGIN_THROTTLE_LIMIT` par minute et par IP (5 par défaut).
- Dépassement : `429 { message: "Trop de requêtes, veuillez réessayer dans quelques instants" }`.
- L'IP lue est celle du visiteur grâce à `trust proxy` (voir [Déploiement](#déploiement)).

### CORS

- `CORS_ORIGIN` défini : uniquement ces origines exactes (séparées par des virgules).
- `CORS_ORIGIN` vide : seules les pages ouvertes sur `http://localhost:<port>` et
  `http://127.0.0.1:<port>` sont acceptées. **L'ancienne IP du réseau local écrite
  en dur a été retirée** : pour ouvrir le front depuis un autre appareil, ajouter son
  adresse exacte dans `CORS_ORIGIN`.
- `credentials: true` (nécessaire au cookie), méthodes `GET/POST/PATCH/DELETE`,
  en-têtes `Content-Type` et `Authorization`, préflight mis en cache 10 minutes.

> Le CORS n'est appliqué que par les **navigateurs**. Un script (`curl`, etc.)
> l'ignore : ce n'est pas lui qui protège l'API, c'est le JWT.

### Helmet

`helmet()` avec `crossOriginResourcePolicy: cross-origin` : le front, servi depuis
une autre origine, doit pouvoir lire les réponses. Ajoute notamment
`X-Content-Type-Options`, `Strict-Transport-Security` et une CSP, et supprime
`X-Powered-By`.

### Format d'erreur unique

Toutes les erreurs répondent `{ "statusCode": <n>, "message": "<texte>" }` :

- les erreurs volontaires (`400`, `401`, `404`, `409`, `429`…) gardent leur message ;
- toute autre erreur (bug, erreur Prisma…) est **journalisée côté serveur** et le
  client reçoit `500 { "message": "Erreur interne du serveur" }`, sans trace ni détail.

### Mots de passe SMTP masqués

`GET /entite` ne renvoie plus `MDP_SMTP` ni `MDP_SMTP_Planning`, seulement les
booléens `MDP_SMTP_defini` et `MDP_SMTP_Planning_defini`. `PATCH /entite` ignore un
mot de passe vide (« inchangé ») et ne remplace la valeur que si une nouvelle est
envoyée.

## Frontend

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/lib/api.ts` | **Point d'appel unique** : `apiFetch()` / `apiJson()`. Préfixe l'URL, joint le jeton, renouvelle la session sur un 401 et rejoue la requête, lève une `ApiError` avec le message du serveur |
| `src/lib/auth.ts` | Jeton en mémoire, `login()`, `refreshSession()` (une seule requête même si appelée plusieurs fois en même temps), `logout()` |
| `src/lib/errors.ts` | `ApiError` et lecture du message d'erreur du serveur |
| `src/auth/AuthProvider.tsx` | Garde d'accès : n'affiche l'application qu'une fois la session ouverte (automatiquement, ou via l'écran de connexion s'il est activé) |
| `src/auth/AuthContext.ts` | Contexte et hook `useAuth()` (`login`, `canSignOut`, `signOut`) |
| `src/auth/LoginPage.tsx` / `.css` | Écran de connexion (conservé, **non affiché** tant que `VITE_LOGIN_SCREEN` n'est pas `true`) |
| `src/lib/config.ts` | Interrupteur `LOGIN_SCREEN_ENABLED` |
| `src/App.tsx` | Enveloppe l'application dans `AuthProvider` |
| `src/layout/Sidebar.tsx` / `.css` | Nom de l'utilisateur et bouton « Se déconnecter » en bas du menu, **uniquement si l'écran de connexion est activé** |

### Règle à respecter

**Aucun `fetch` direct dans les features** : tout appel à l'API passe par
`apiFetch` / `apiJson` (ou par `useApiList` / `useApiMutation`, qui les utilisent).
Sinon la requête part sans jeton et reçoit un `401`. Les appels qui utilisaient
`fetch` directement ont été convertis : `useApiList`, `useApiMutation`,
`useEntite`, `EntiteForm` (pays, villes), `useEnumerations`,
`useEnumerationLabels`, `useTypesFacture`, `ContratForm`, `SocieteContratsTab`,
`SocieteMessagesTab`.

### Gestion des erreurs

Les messages du serveur (« Trop de requêtes… », « Identifiant ou mot de passe
incorrect », et plus tard « Vous devez renseigner… ») arrivent tels quels dans
`err.message`. `CrudPage` et les `alert` existants les affichent donc sans
changement, à la place de l'ancien `HTTP 400`.

### Impression du PDF

Un lien `<a href>` ne peut pas envoyer d'en-tête `Authorization`. Le bouton
**Imprimer** de la fiche contrat télécharge donc le PDF avec `apiFetch`, crée un
`Blob`, puis l'ouvre dans un nouvel onglet. L'onglet est ouvert **pendant le clic**
(avant l'attente réseau), sinon le navigateur le bloquerait comme fenêtre publicitaire.

## Écran de connexion désactivé (temporaire)

Tant que la vraie authentification n'est pas en place, demander un identifiant à
l'utilisateur n'apporterait rien (le backend accepte tout). L'écran est donc
**conservé mais non utilisé**, et le front ouvre lui-même la session.

**Fonctionnement** (`AuthProvider.tsx`, `lib/auth.ts`) :

1. Au chargement, le front tente `POST /auth/refresh` (cookie de renouvellement).
2. Sans session valide, il appelle `loginAutomatically()` : une connexion avec un
   identifiant de remplacement (`utilisateur` / `session-automatique`, simples valeurs
   réservées, pas de vrais identifiants). Plusieurs appels simultanés (double montage
   React en développement) partagent **une seule** connexion, pour ne pas consommer la
   limite de 5 tentatives par minute.
3. Le jeton d'accès est ensuite géré comme d'habitude : en mémoire, envoyé dans
   `Authorization`, renouvelé automatiquement à l'expiration. Le cookie de
   renouvellement évite de rouvrir une session à chaque rechargement (8 h).

**Ce qui change à l'écran** : plus d'écran de connexion, plus de nom d'utilisateur ni de
bouton « Se déconnecter » dans le menu (se déconnecter rouvrirait aussitôt une session).

**Si le serveur est injoignable ou la limite de connexion atteinte** : un message
« Impossible d'ouvrir la session : … » et un bouton « Réessayer » sont affichés.

**Ce qui ne change pas** : le guard JWT reste actif côté API, une requête sans jeton
reçoit toujours `401`, le rate limit et le renouvellement fonctionnent à l'identique.

**Réactiver l'écran de connexion** : `VITE_LOGIN_SCREEN=true` dans l'environnement du
front (`frontend/.env`, ou variable de l'hébergeur au moment du build), puis relancer
Vite ou rebuilder. `LoginPage` est alors affiché à la place de la session automatique.

## Variables d'environnement

**Backend** — documentées dans `backend/.env.example`.

| Variable | Défaut | Rôle |
|---|---|---|
| `JWT_SECRET` | *(secret temporaire aléatoire)* | Secret de signature, **32 caractères minimum**. Générer : `openssl rand -base64 48`. Absent : un secret temporaire est créé et un avertissement s'affiche ; les sessions sont perdues à chaque redémarrage |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` (15 min) | Durée du jeton d'accès |
| `COOKIE_SAMESITE` | `lax` | `lax`, `strict` ou `none`. `none` impose HTTPS (`Secure` est alors forcé) |
| `COOKIE_SECURE` | `false` | `true` pour n'envoyer le cookie qu'en HTTPS |
| `CORS_ORIGIN` | *(localhost)* | Origines autorisées, séparées par des virgules |
| `TRUST_PROXY` | auto | Nombre de proxys devant l'API. Détecté (`1`) sur Railway via `RAILWAY_ENVIRONMENT`, sinon `0` |
| `THROTTLE_LIMIT` | `300` | Requêtes/min/IP, toutes routes |
| `LOGIN_THROTTLE_LIMIT` | `5` | Tentatives de connexion/min/IP |
| `CGV_URL` | *(vide)* | Lien « ICI » du pied de page des PDF de contrat (sans rapport avec l'authentification) |

**Frontend** — documentées dans `frontend/.env.example`.

| Variable | Défaut | Rôle |
|---|---|---|
| `VITE_API_URL` | `http://<hôte>:3000` | Adresse de l'API |
| `VITE_LOGIN_SCREEN` | `false` | `true` affiche l'écran de connexion ; sinon session automatique |

## Déploiement

### Railway

Build et démarrage du back sont fixés dans [`backend/railway.json`](../backend/railway.json)
(`npm run build`, puis `npm run start:prod` : migrations puis `node dist/main`).
Ce fichier ne suit pas le *Root Directory* : dans les réglages du service back,
indiquer **Root Directory** = `/backend` et **Railway Config File** =
`/backend/railway.json`. Sans lui, la commande par défaut `npm start` lance
aussi l’application compilée (sans les migrations).

Ne jamais démarrer le back avec `nest start` en production : la compilation
au démarrage dépasse la mémoire du conteneur (`JavaScript heap out of memory`,
réponse 502).

1. Définir `JWT_SECRET` (32 caractères ou plus) dans les variables du service back.
2. Définir `CORS_ORIGIN` avec l'adresse **exacte** du front.
3. Si le front et l'API sont sur des **domaines différents** (deux sous-domaines
   Railway, par exemple) : `COOKIE_SAMESITE=none`.
   S'ils partagent le même site (`app.exemple.be` et `api.exemple.be`), garder `lax`.
4. `TRUST_PROXY` est détecté automatiquement. Sans cela, tous les visiteurs auraient
   l'IP du proxy et partageraient les mêmes limites de requêtes.
5. Côté front, `VITE_API_URL` doit pointer vers l'API.

Si le cookie est mal réglé, le seul effet est une **nouvelle connexion à chaque
rechargement de page** (le renouvellement silencieux échoue) : rien ne casse.

### Serveur dédié

- Servir front et API en **HTTPS**, idéalement sur le même site (sous-domaines d'un
  même domaine) pour garder `COOKIE_SAMESITE=lax`.
- Derrière Nginx ou un autre proxy : `TRUST_PROXY=1` (ou le nombre de proxys).
- `COOKIE_SECURE=true`.

## Passer à une vraie authentification

Un seul point à remplacer : `AuthService.authenticate()` dans
`backend/src/auth/auth.service.ts`. Jetons, guards, cookie et front n'ont pas à changer.

Aujourd'hui :

```ts
async authenticate(login: string, _password: string): Promise<AuthUser | null> {
  return { sub: login };
}
```

À faire :

1. **Vérifier le format de `utilisateurs.Password_hash`.** S'il vient de WinDev et
   n'est pas un hachage standard (argon2, bcrypt), il faudra réinitialiser les mots
   de passe (par exemple avec une commande qui définit un mot de passe par utilisateur).
2. Chercher l'utilisateur (`Login`, `Actif = 1`), comparer le mot de passe avec la
   bibliothèque de hachage choisie (par exemple `argon2`), et renvoyer `null` si les
   identifiants sont faux. Garder le **même message** pour « login inconnu » et
   « mot de passe faux » : il ne faut pas révéler quels logins existent.
3. Renvoyer `{ sub: String(user.IDUTILISATEURS) }` : `sub` devient l'identifiant
   numérique, utilisable pour remplir « créé par / modifié par ».
4. Dans `POST /auth/refresh`, **revérifier `Actif` en base** pour qu'un utilisateur
   désactivé ne puisse plus renouveler sa session.
5. Si l'affichage du nom est souhaité, le renvoyer via `GET /auth/me` (le jeton ne
   porte volontairement que `sub`).
6. **Côté front** : mettre `VITE_LOGIN_SCREEN=true` pour réactiver l'écran de
   connexion, puis supprimer `loginAutomatically()` et son identifiant de
   remplacement (`AUTO_LOGIN`) dans `lib/auth.ts`, ainsi que l'effet « session
   automatique » d'`AuthProvider.tsx`.

## Tester

Remplacer `<API>` par l'adresse du backend (par exemple `http://localhost:3000`).

```bash
# 1. Sans jeton : 401
curl -i <API>/contrats

# 2. Connexion : renvoie accessToken et pose le cookie
curl -i -c cookies.txt -X POST <API>/auth/login \
  -H "Content-Type: application/json" -d '{"login":"test","password":"test"}'

# 3. Avec jeton : 200
curl <API>/contrats -H "Authorization: Bearer <accessToken>"

# 4. Renouvellement avec le cookie
curl -b cookies.txt -X POST <API>/auth/refresh

# 5. Limitation : la 6e tentative de connexion dans la minute répond 429
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -X POST <API>/auth/login \
  -H "Content-Type: application/json" -d '{"login":"a","password":"b"}'; done

# 6. CORS : origine refusée = pas d'en-tête Access-Control-Allow-Origin
curl -i -X OPTIONS <API>/contrats -H "Origin: https://autre-site.example" \
  -H "Access-Control-Request-Method: GET"
```

Pour tester le renouvellement automatique sans attendre 15 minutes, démarrer le
backend avec `ACCESS_TOKEN_TTL_SECONDS=4`, se connecter, attendre quelques secondes
puis ouvrir une page : la requête reçoit un vrai `401`, le front renouvelle et rejoue.

Vérifié lors de la mise en place : refus sans jeton, connexion vide (`400`), cookie
`HttpOnly`/`Path=/auth`, contenu minimal du jeton, jeton falsifié et `alg=none` (`401`),
audiences croisées refusées, CORS accepté/refusé, en-têtes helmet, `GET /entite` sans
mots de passe, PDF avec et sans jeton, erreur `500` sobre, `429` sur la connexion, et
dans le navigateur : écran de connexion, reprise après rechargement, jeton réellement
expiré puis renouvelé, impression du PDF, session perdue, déconnexion.

## Limites connues et suite

- **Connexion factice** (voir l'avertissement en tête de document).
- **Pas de rôles ni de permissions** : tout utilisateur connecté a accès à toute l'API.
- **Pas de révocation immédiate** : un jeton de renouvellement reste valide jusqu'à
  son expiration (8 h) ; « Se déconnecter » efface le cookie du navigateur mais ne
  l'invalide pas côté serveur. Une vraie authentification peut revérifier `Actif` à
  chaque renouvellement (limite le risque) ; une révocation complète demanderait une
  table de jetons.
- **Champs « créé par / modifié par »** toujours à `NULL` : à remplir avec `sub` une
  fois l'authentification réelle en place.
- **Cookie cross-site** (`COOKIE_SAMESITE=none`) non testé hors de la machine locale.
- **Validation des entrées** (« Vous devez renseigner… ») : non implémentée. Le
  format d'erreur et `apiFetch` sont prêts à afficher ces messages.
- **OpenAPI/Swagger** : mis de côté volontairement pour plus tard.
