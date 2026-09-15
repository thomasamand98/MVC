// Point d'entrée du backend : démarre le serveur NestJS.
// Charge app.module.ts (qui assemble tous les modules, dont HelloModule)
// et écoute sur le port 3000. Le frontend (React, port 5173) appelle
// cette API en HTTP — enableCors() l'autorise à le faire.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:5173' });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
