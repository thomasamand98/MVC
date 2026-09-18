// ===== MODEL (logique métier) =====
// Liste de référence utilisée pour peupler les sélecteurs "Fournisseur"
// (ex. IDFOURNISSEURS de SocieteForm.tsx) — même rôle que ClientService.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

@Injectable()
export class FournisseurService {
  constructor(private readonly prisma: PrismaService) {}

  async getFournisseurs() {
    const fournisseurs = await this.prisma.fournisseur.findMany({
      orderBy: { IDFOURNISSEURS: 'asc' },
      select: { IDFOURNISSEURS: true, Numero_fournisseur: true },
    });
    return { fournisseurs: serializeBigInt(fournisseurs) };
  }
}
