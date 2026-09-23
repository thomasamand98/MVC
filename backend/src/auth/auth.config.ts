// Réglages de l'authentification : durées des jetons, émetteur/audiences,
// secret de signature et options du cookie de renouvellement. Les variables
// d'environnement sont lues à la demande (et non à l'import) pour que
// `dotenv/config`, chargé en tête de main.ts, ait déjà rempli process.env.
import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

export const ISSUER = 'mvc-template-api';
// Deux audiences distinctes : un jeton de renouvellement ne peut pas servir
// de jeton d'accès (et inversement), même signé avec le même secret.
export const ACCESS_AUDIENCE = 'mvc-template-app';
export const REFRESH_AUDIENCE = 'mvc-template-refresh';

// Jeton d'accès court, gardé en mémoire par le front ; jeton de
// renouvellement plus long, dans un cookie httpOnly. Durée du jeton d'accès
// réglable via ACCESS_TOKEN_TTL_SECONDS (15 minutes par défaut). Fonction
// plutôt que constante, comme le reste de ce fichier : lue à la demande, pas
// à l'import (voir l'en-tête de ce fichier).
export const accessTtlSeconds = () => Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 15 * 60;
export const REFRESH_TTL_SECONDS = 8 * 60 * 60;

export const REFRESH_COOKIE = 'refresh_token';
// Le cookie n'est envoyé qu'aux routes /auth/*, jamais au reste de l'API.
export const REFRESH_COOKIE_PATH = '/auth';

let secret: string | undefined;

// JWT_SECRET (voir .env.example) : au moins 32 caractères. Absent, on
// génère un secret aléatoire propre à ce processus — jamais un secret connu
// par défaut — et on prévient : les sessions ne survivent alors pas à un
// redémarrage.
export function getJwtSecret(): string {
  if (secret) return secret;
  const configured = process.env.JWT_SECRET?.trim();
  if (configured) {
    if (configured.length < 32) throw new Error('JWT_SECRET est trop court (32 caractères minimum).');
    secret = configured;
  } else {
    secret = randomBytes(48).toString('base64');
    Logger.warn(
      'JWT_SECRET absent : secret temporaire généré, les sessions seront perdues au prochain redémarrage.',
      'Auth',
    );
  }
  return secret;
}

// COOKIE_SAMESITE (lax par défaut) / COOKIE_SECURE : le front et l'API sur
// le même site (ex. localhost, ou app.x.be + api.x.be) fonctionnent avec les
// valeurs par défaut. Front et API sur des domaines différents (ex. deux
// sous-domaines Railway) demandent COOKIE_SAMESITE=none, qui impose HTTPS.
export function getRefreshCookieOptions() {
  const configured = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite = configured === 'none' || configured === 'strict' ? configured : 'lax';
  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === 'none' || process.env.COOKIE_SECURE === 'true',
    path: REFRESH_COOKIE_PATH,
  } as const;
}
