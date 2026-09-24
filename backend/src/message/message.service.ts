// ===== MODEL (logique métier) =====
// Alimente l'onglet « Messages envoyés » de la fiche Société
// (SocieteForm.tsx) — lecture seule, pas de création/modification depuis
// cet onglet.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
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

  // search : champ Rechercher de l'onglet (voir common/search.ts).
  async getMessagesBySociete(societeId: bigint, search?: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        IDSOCIETES: societeId,
        ...buildSearchWhere<Prisma.MessageWhereInput>(search, (c) => [
          { Sujet: c },
          { Destinataire: c },
          { Type_message: c },
          { NomContact: c },
        ]),
      },
      orderBy: { Date_heure_creation: 'desc' },
      select: messageSelect,
    });
    return { messages: serializeBigInt(messages) };
  }
}
