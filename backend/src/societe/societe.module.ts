// Module NestJS qui regroupe la fonctionnalité "hello" au complet :
// - HelloController (couche Controller, reçoit les requêtes HTTP)
// - HelloService (couche Model/logique métier)
// - PrismaService (couche Model/accès aux données, injectée dans HelloService)
// C'est ce module qui est importé par app.module.ts pour brancher la route
// GET /hello dans l'application.
import { Module } from '@nestjs/common';
import { SocieteController } from './societe.controller.js';
import { SocietesService } from './societe.service.js';

@Module({
  controllers: [SocieteController],
  providers: [SocietesService],
})
export class SocieteModule {}
