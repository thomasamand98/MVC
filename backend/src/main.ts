// Point d'entrée du backend : démarre le serveur NestJS.
// Charge app.module.ts (qui assemble tous les modules, dont HelloModule)
// et écoute sur le port 3000. Le frontend (React, port 5173) appelle
// cette API en HTTP — enableCors() l'autorise à le faire.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Autorise n'importe quel port sur localhost ou l'IP LAN de cette machine —
  // Vite change de port automatiquement (5173, 5174, ...) si le précédent est
  // déjà occupé par une autre instance du serveur de dev.
  const allowedOrigin = /^http:\/\/(localhost|192\.168\.1\.122):\d+$/;
  app.enableCors({ origin: allowedOrigin });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
