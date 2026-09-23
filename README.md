# MVC Template — Hello World

Démonstration du pattern **MVC** avec React (View), NestJS (Controller), Prisma + MySQL (Model).

## Le flux MVC

```
Navigateur (View: React)
      │  fetch GET http://localhost:3000/hello
      ▼
Controller (backend/src/hello/hello.controller.ts)
      │  appelle le Service, aucune logique métier ici
      ▼
Model — Service (backend/src/hello/hello.service.ts)
      │  logique métier + appel Prisma
      ▼
Model — Prisma (backend/prisma/schema.prisma)
      │  requête SQL générée
      ▼
Base de données MySQL (table `Message`)
```

- **Model** = `prisma/schema.prisma` (structure des données) + `hello.service.ts` (logique d'accès aux données via Prisma).
- **View** = `frontend/src/App.tsx` (affichage, ne connaît que l'API HTTP).
- **Controller** = `hello.controller.ts` (reçoit la requête HTTP, appelle le Model, renvoie une réponse — zéro logique métier).

## Lancer le projet

### 1. Backend (NestJS + Prisma + MySQL)

```bash
cd backend
```

Configure `.env` avec tes identifiants MySQL (`DATABASE_URL`), puis crée la table :

```bash
npx prisma migrate dev --name init
```

Démarre le serveur :

```bash
npm run start:dev
```

→ API disponible sur http://localhost:3000/hello

### 2. Frontend (React)

```bash
cd frontend
npm run dev
```

→ App disponible sur http://localhost:5173


## Documentation

- [Journal des modifications](docs/modifications.md) — ce qui a été ajouté ou modifié (énumérations, fiche contrat, PDF, sécurité).
- [Sécurité et authentification](docs/securite-authentification.md) — JWT, rate limit, CORS, helmet, déploiement, et comment remplacer la connexion factice.
