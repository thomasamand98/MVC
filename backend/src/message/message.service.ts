// ===== MODEL (logique métier) =====
// Alimente l'onglet « Messages envoyés » de la fiche Société
// (SocieteForm.tsx) — lecture seule, pas de création/modification depuis
// cet onglet.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

export const messageSelect = {
  IDMESSAGES: true,
  Sujet: true,
  Destinataire: true,
  Type_message: true,
  Date_message: true,
  Heure_message: true,
  NomContact: true,
} satisfies Prisma.MessageSelect;

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessagesBySociete(societeId: bigint) {
    const messages = await this.prisma.message.findMany({
      where: { IDSOCIETES: societeId },
      orderBy: { Date_heure_creation: 'desc' },
      select: messageSelect,
    });
    return { messages: serializeBigInt(messages) };
  }
}
