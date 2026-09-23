// ===== MODEL (logique métier) =====
// Types de facture (table types_facture), proposés dans le sélecteur « Type
// facture » de la fiche contrat. Lecture seule : appelé uniquement par
// TypeFactureController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

@Injectable()
export class TypeFactureService {
  constructor(private readonly prisma: PrismaService) {}

  async getTypesFacture() {
    const typesFacture = await this.prisma.typeFacture.findMany({
      orderBy: { IDTYPES_FACTURE: 'asc' },
      select: { IDTYPES_FACTURE: true, Nom: true },
    });
    return { typesFacture: serializeBigInt(typesFacture) };
  }
}
