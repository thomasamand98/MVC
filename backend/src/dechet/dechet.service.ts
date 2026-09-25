// ===== MODEL (logique métier) =====
// Déchets (table dechets), proposés dans le sélecteur « Déchets » de la fiche
// marchandise. Lecture seule : appelé uniquement par DechetController —
// jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

// Nombre de déchets renvoyés par recherche : le sélecteur en affiche une
// courte liste, affinée par la saisie.
const SEARCH_LIMIT = 30;

export const dechetSelect = {
  IDDECHETS: true,
  Code: true,
  Description_dechet: true,
} satisfies Prisma.DechetSelect;

@Injectable()
export class DechetService {
  constructor(private readonly prisma: PrismaService) {}

  async getDechets(search?: string) {
    const where = buildSearchWhere<Prisma.DechetWhereInput>(search, (c) => [{ Code: c }, { Description_dechet: c }]);
    const dechets = await this.prisma.dechet.findMany({
      where,
      orderBy: { Code: 'asc' },
      select: dechetSelect,
      take: SEARCH_LIMIT,
    });
    return { dechets: serializeBigInt(dechets) };
  }
}
