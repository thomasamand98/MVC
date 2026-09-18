// ===== MODEL (logique métier) =====
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

@Injectable()
export class PaysService {
  constructor(private readonly prisma: PrismaService) {}

  // ~240 lignes seulement — chargées en une fois, contrairement aux villes
  // (voir VilleService) — alimente le menu déroulant Pays de EntiteForm.tsx.
  async getPays() {
    const pays = await this.prisma.pays.findMany({
      orderBy: { Nom: 'asc' },
      select: { IDPAYS: true, ISO: true, Nom: true },
    });
    return { pays: serializeBigInt(pays) };
  }
}
