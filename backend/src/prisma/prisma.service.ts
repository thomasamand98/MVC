// ===== MODEL (accès aux données) =====
// Fondation du Model : encapsule la connexion à MySQL via Prisma.
// PrismaClient est généré automatiquement à partir de
// backend/prisma/schema.prisma (commande `npx prisma generate`,
// sortie dans backend/src/generated/prisma).
// Cette classe est injectée dans les Services (ex: hello.service.ts) qui
// ont besoin de lire/écrire des données — jamais directement dans un
// Controller.
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // L'adaptateur lit l'URL de connexion (utilisateur/mot de passe/DB)
    // dans backend/.env → variable DATABASE_URL.
    super({ adapter: new PrismaMariaDb(process.env.DATABASE_URL as string) });
  }

  // Ouvre la connexion MySQL quand NestJS démarre le module.
  async onModuleInit() {
    await this.$connect();
  }

  // Ferme proprement la connexion quand l'application s'arrête.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
