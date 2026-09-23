# Journal des modifications — 21 septembre 2026

Résumé de tout ce qui a été ajouté ou modifié depuis le dernier commit
(`f9c590d`). Rien n'est encore commité. Quatre lots :

1. [Énumérations (Configuration)](#1-énumérations-configuration)
2. [Fiche contrat](#2-fiche-contrat)
3. [Impression PDF du contrat](#3-impression-pdf-du-contrat)
4. [Sécurité et authentification](#4-sécurité-et-authentification)

Puis : [Dépendances](#dépendances-ajoutées), [Variables d'environnement](#variables-denvironnement-ajoutées),
[Nouvelles routes de l'API](#nouvelles-routes-de-lapi) et [Points d'attention](#points-dattention).

---

## 1. Énumérations (Configuration)

**But** : dans Configuration › Enumérations, choisir une catégorie et voir, gérer
les valeurs qui lui sont liées.

**Backend**
- `src/categorie-enumeration/` : liste (avec le nombre de valeurs par catégorie),
  création, modification, suppression. Suppression refusée (`409`) pour une
  catégorie **système** ou qui contient encore des valeurs.
- `src/enumeration/` : liste (filtrable par `?categorieId=` ou par nom technique
  `?categorie=`), création, modification, suppression. Suppression refusée (`409`)
  pour une valeur **système**. Tri par `Ordre` puis libellé.
- À la création, `IDUTILISATEURS_createur/modificateur` sont mis à `NULL`
  explicitement : leur défaut en base (`0`) viole la clé étrangère (aucun
  utilisateur d'id 0).

**Frontend** (`src/features/enumerations/`)
- Écran maître/détail : catégories à gauche (recherche insensible aux accents,
  compteur, cadenas système), valeurs à droite (recherche, tableau, actions).
- Formulaires en modale pour les catégories et les valeurs, avec la case
  **« Valeur système »** et la colonne « Système » du tableau. Le nom technique
  d'une catégorie système et la `Valeur` d'une valeur système sont verrouillés.
- Responsive : cartes empilées sous 900 px, lignes en cartes sous 640 px.
- `layout/AppLayout.tsx` : l'entrée de menu « Enumérations » affiche cette page.

## 2. Fiche contrat

**But** : remplacer le formulaire simple par une fiche à trois onglets,
d'après la capture de l'ancienne application.

**Backend**
- `GET /contrats/:id` enrichi : numéro client et taux de TVA du client, conditions
  CMR, prestations (avec marchandise), factures, et `Chiffre_affaires`
  (somme HT des factures du contrat, **hors proformas**).
- `src/condition-cmr/` : `POST`, `PATCH`, `DELETE /conditions-cmr`.
- `src/type-facture/` : `GET /types-facture` (alimente le sélecteur « Type facture »).
- `GET /enumerations?categorie=<nom>` : libellés d'une catégorie par son nom technique.
- Sur `POST/PATCH /contrats`, une chaîne vide **efface** désormais le champ (date
  de fin, société, type de facture, taux de TVA). Avant, elle était ignorée ; pour
  `Taux_tva`, MySQL la rejetait.

**Frontend** (`src/features/contrats/`)
- `ContratForm.tsx` : onglets **Détail** / **Prestations** / **Factures**.
  - Détail : cartes Contrat, Client, Archivage, Conditions CMR, Chiffres clés.
    Changer de société met à jour le numéro client et reprend son taux de TVA.
  - Prestations et Factures : lecture seule, avec les libellés d'unité et d'état
    tirés des énumérations `unite_prestation` et `etat_facture`.
  - Onglets et conditions CMR désactivés tant que le contrat n'est pas créé.
- `ContratConditionsCmr.tsx` : ajout (bouton ou Entrée), case à cocher, suppression,
  envoyés tout de suite à l'API sans attendre « Enregistrer ».
- Le numéro s'affiche avec sa version (`Num_contrat.Version_contrat`, ex. `1680.24/07`),
  en lecture seule pour un contrat existant.
- `ContratForm.css` : la modale est élargie (1100 px) pour cette fiche seulement.
- Champs retirés du formulaire (l'API les accepte toujours, ils ne sont plus écrasés) :
  Type de contrat, Version, Suivant, Qt client facturation, ID marchandise.

## 3. Impression PDF du contrat

**But** : générer le document « état de contrat » d'après le PDF d'exemple.

**Backend** (`src/contrat/`)
- `GET /contrats/:id/pdf` → PDF `inline`, nom `Contrat-<numéro>.pdf`.
- `contrat-pdf.service.ts` : collecte les données (contrat, client et adresse de
  facturation, entité émettrice, prestations et suppléments, libellés d'énumérations).
- `contrat-pdf.renderer.ts` : **mise en page** (PDFKit) — en-tête, destinataire,
  références, tableau des prestations avec suppléments, TVA, clauses, signatures,
  pied de page, numérotation « n/N », saut de page automatique. C'est le fichier à
  modifier pour changer la structure ou les textes fixes.
- Les coordonnées de l'entreprise (nom, adresse, TVA, banque, IBAN, e-mail) viennent
  de la table `entites`, aucune n'est écrite en dur.
- Le logo est lu dans `entites.Logo` (PNG ou JPEG). **Vide en base aujourd'hui** :
  l'en-tête n'a alors que le texte.
- Le lien « ICI » (conditions générales) utilise `CGV_URL`.

**Frontend**
- Bouton **Imprimer** dans la fiche contrat (voir la note sur l'authentification dans
  [securite-authentification.md](securite-authentification.md#impression-du-pdf)).

## 4. Sécurité et authentification

Détail complet dans [securite-authentification.md](securite-authentification.md).

**Backend**
- `src/auth/` : JWT (HS256), routes `/auth/login|refresh|logout|me`, guard global
  (`@Public()` pour les exceptions). **Connexion factice** : accepte tout.
- Rate limit (`@nestjs/throttler`) : 300 req/min/IP, 5 tentatives de connexion/min/IP.
- `src/main.ts` : helmet, cookie-parser, CORS resserré (plus d'IP LAN en dur),
  confiance dans le proxy (détection Railway).
- `src/common/all-exceptions.filter.ts` : format d'erreur unique, sans détail interne.
- `src/entite/entite.service.ts` : les mots de passe SMTP ne sont plus renvoyés ;
  vides à l'envoi = inchangés.

**Frontend**
- `src/lib/api.ts`, `auth.ts`, `errors.ts` : point d'appel unique, jeton en mémoire,
  renouvellement automatique, messages d'erreur du serveur.
- `src/auth/` : `AuthProvider`, écran de connexion (**conservé mais désactivé** :
  une session automatique est ouverte au chargement ; réactivable avec
  `VITE_LOGIN_SCREEN=true`).
- `layout/Sidebar.*` : utilisateur connecté et déconnexion, affichés seulement si
  l'écran de connexion est activé.
- Tous les `fetch` directs des features ont été convertis (voir le document dédié).
- `features/entite/*` : champs mot de passe SMTP vides avec l'indication « (inchangé) ».

---

## Dépendances ajoutées

Backend (`backend/package.json`) :

| Paquet | Usage |
|---|---|
| `pdfkit`, `@types/pdfkit` | Génération du PDF de contrat |
| `@nestjs/jwt` | Jetons JWT |
| `@nestjs/throttler` | Limitation du nombre de requêtes |
| `helmet` | En-têtes de sécurité HTTP |
| `cookie-parser`, `@types/cookie-parser` | Lecture du cookie de renouvellement |

Aucune dépendance ajoutée côté frontend.

## Variables d'environnement ajoutées

Toutes documentées dans `backend/.env.example` (détail dans
[securite-authentification.md](securite-authentification.md#variables-denvironnement)) :
`JWT_SECRET`, `ACCESS_TOKEN_TTL_SECONDS`, `COOKIE_SAMESITE`, `COOKIE_SECURE`,
`TRUST_PROXY`, `THROTTLE_LIMIT`, `LOGIN_THROTTLE_LIMIT`, `CGV_URL`.

Un `JWT_SECRET` généré a été ajouté au `backend/.env` local (non versionné).

Côté frontend (`frontend/.env.example`) : `VITE_LOGIN_SCREEN` (`false` par défaut).

## Nouvelles routes de l'API

Toutes exigent un jeton, sauf `/auth/login`, `/auth/refresh` et `/auth/logout`.

| Route | Rôle |
|---|---|
| `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | Session |
| `GET/POST /categories-enumeration`, `PATCH/DELETE /categories-enumeration/:id` | Catégories d'énumération |
| `GET/POST /enumerations`, `PATCH/DELETE /enumerations/:id` | Valeurs d'énumération (`?categorieId=`, `?categorie=`) |
| `POST /conditions-cmr`, `PATCH/DELETE /conditions-cmr/:id` | Conditions CMR d'un contrat |
| `GET /types-facture` | Types de facture |
| `GET /contrats/:id/pdf` | PDF du contrat |

Routes modifiées : `GET /contrats/:id` (données enrichies), `POST/PATCH /contrats`
(chaîne vide = effacer), `GET/PATCH /entite` (mots de passe SMTP masqués).

## Points d'attention

- **La connexion est factice** : elle ne protège pas encore réellement l'API.
- **Tests de bout en bout** : réalisés à chaque lot avec de vraies requêtes et le
  navigateur, sur des données de test **supprimées ensuite** (la base est revenue à
  son état d'origine).
- **Hypothèses métier à confirmer** : le CA exclut les proformas ; le PDF n'imprime
  que le numéro de contrat (sans la version) et toutes les prestations supplémentaires
  (sans filtre de dates de validité) ; les notes de crédit n'ont pas pu être vérifiées
  (aucune facture en base).
- **Données absentes en base** : aucun logo d'entité, aucun type de facture, aucune
  prestation ni facture.
- **Tout appel à l'API sans jeton reçoit maintenant `401`** (scripts, `curl`).
- **Railway** : définir `JWT_SECRET`, vérifier `CORS_ORIGIN`, et `COOKIE_SAMESITE=none`
  si le front et l'API sont sur des domaines différents.
- **Redémarrage nécessaire** : un backend lancé avant ces modifications
  (`node dist/main`) ne les prend pas en compte ; utiliser `npm run start:dev` (rechargement
  automatique) ou recompiler puis relancer.
