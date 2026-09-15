// ===== MODEL (logique métier) =====
// Ce Service porte la logique métier du Model : il sait comment lire/écrire
// la donnée via Prisma (this.prisma, injecté depuis prisma.service.ts).
// Appelé uniquement par HelloController — jamais par la View directement.
// La forme des données manipulées ici (Message.content) est définie dans
// backend/prisma/schema.prisma.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HelloService {
  // NestJS injecte le PrismaService (connexion MySQL) automatiquement.
  constructor(private readonly prisma: PrismaService) {}

  async getMessage(): Promise<{ content: string; numero: number }> {
    // this.prisma.message → correspond au model "Message" du schema.prisma
    const existing = await this.prisma.message.findFirst();
    if (existing) {
      return existing;
    }

    // Rien en base au premier lancement : on crée la donnée de départ.
    return this.prisma.message.create({
      data: { content: 'Hello World', numero: 1 },
    });
  }
}
