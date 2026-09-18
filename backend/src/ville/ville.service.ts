// ===== MODEL (logique métier) =====
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

@Injectable()
export class VilleService {
  constructor(private readonly prisma: PrismaService) {}

  // Recherche par code postal exact — la table compte ~39 000 lignes,
  // impossible à charger en une fois côté frontend (voir EntiteForm.tsx,
  // liste Villes alimentée au fur et à mesure de la saisie du code postal).
  async searchVilles(cp: string) {
    const villes = await this.prisma.ville.findMany({
      where: { CP: cp },
      select: { IDVILLES: true, CP: true, Nom_ville: true },
      take: 20,
    });
    return { villes: serializeBigInt(villes) };
  }
}
