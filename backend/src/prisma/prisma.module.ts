// Rend PrismaService disponible partout sans que chaque module métier ait à
// le redéclarer dans ses `providers` — sinon NestJS instancie un
// PrismaService (donc une connexion MySQL + le runtime Prisma complet)
// par module qui le déclare, au lieu d'une seule instance partagée.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
