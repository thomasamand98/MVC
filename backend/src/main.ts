// Point d'entrée du backend : démarre le serveur NestJS.
// Charge app.module.ts (qui assemble tous les modules, dont HelloModule)
// et écoute sur le port défini par PORT (3000 par défaut). Le frontend
// appelle cette API en HTTP — enableCors() l'autorise à le faire.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// CORS_ORIGIN (voir .env) : liste d'origines autorisées séparées par des
// virgules, ex. "https://mon-front.vercel.app,https://mon-front-preview.vercel.app".
// Non défini (dev local) : on retombe sur n'importe quel port sur localhost
// ou l'IP LAN de cette machine — Vite change de port automatiquement
// (5173, 5174, ...) si le précédent est déjà occupé.
const allowedOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : /^http:\/\/(localhost|192\.168\.1\.122):\d+$/;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: allowedOrigin });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
