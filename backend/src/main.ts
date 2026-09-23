// Point d'entrée du backend : démarre le serveur NestJS.
// Charge app.module.ts (qui assemble tous les modules) et écoute sur le
// port défini par PORT (3000 par défaut). Le frontend appelle cette API en
// HTTP — enableCors() l'autorise à le faire, et helmet ajoute les en-têtes
// de sécurité HTTP.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

// CORS_ORIGIN (voir .env) : liste d'origines autorisées séparées par des
// virgules, ex. "https://mon-front.vercel.app,https://mon-front-preview.vercel.app".
// Non défini (dev local) : seules les pages ouvertes sur localhost/127.0.0.1
// (n'importe quel port — Vite change de port si le précédent est occupé)
// sont acceptées. Pour ouvrir le front depuis un autre appareil du réseau,
// ajouter son adresse exacte dans CORS_ORIGIN.
const allowedOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

// Nombre de proxys placés devant l'API (TRUST_PROXY). Sur Railway (détecté
// via RAILWAY_ENVIRONMENT), un proxy précède l'application : sans cela,
// tous les visiteurs auraient l'adresse IP du proxy et partageraient la même
// limite de requêtes.
function trustProxyHops(): number {
  const configured = Number(process.env.TRUST_PROXY);
  if (process.env.TRUST_PROXY !== undefined && Number.isInteger(configured) && configured >= 0) return configured;
  return process.env.RAILWAY_ENVIRONMENT ? 1 : 0;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', trustProxyHops());
  // Limite par défaut d'express.json() (100kb, bien trop court dès qu'on
  // envoie un logo en data URI base64, voir entite.dto.ts/EntiteForm.tsx).
  app.useBodyParser('json', { limit: '10mb' });
  // Le front, servi depuis une autre origine, lit les réponses de l'API :
  // la politique « même origine » par défaut de helmet le bloquerait.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.enableCors({
    origin: allowedOrigin,
    // Nécessaire pour que le navigateur envoie le cookie de renouvellement
    // de session (voir AuthController).
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
