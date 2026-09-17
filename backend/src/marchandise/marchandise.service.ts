// ===== MODEL (logique métier) =====
// Va chercher toutes les marchandises via Prisma. Appelé uniquement par
// MarchandiseController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMarchandiseDto, UpdateMarchandiseDto } from './marchandise.dto.js';

export const marchandiseSelect = {
  IDMARCHANDISES: true,
  Nom_marchandise: true,
  CouleurPlanning: true,
  IDDECHETS: true,
  Dechet: {
    select: {
      Description_dechet: true,
      Code: true,
      Dangereux: true,
      Autorisation: true,
      Inerte: true,
      Menager: true,
    },
  },
} satisfies Prisma.MarchandiseSelect;

@Injectable()
export class MarchandiseService {
  constructor(private readonly prisma: PrismaService) {}

  async getMarchandises() {
    const marchandises = await this.prisma.marchandise.findMany({
      orderBy: { IDMARCHANDISES: 'asc' },
      select: marchandiseSelect,
    });
    // IDMARCHANDISES, CouleurPlanning et IDDECHETS sont des BigInt
    // (JSON.stringify ne sait pas les sérialiser) → convertis en string pour
    // que la réponse HTTP reste valide.
    return marchandises.map(mapMarchandise);
  }

  async createMarchandise(dto: CreateMarchandiseDto) {
    const data = toMarchandiseData(dto);
    const marchandise = await this.prisma.marchandise.create({
      // IDDECHETS a un défaut DB de 0, qui viole sa contrainte de clé
      // étrangère (aucune ligne d'id 0) quand il est omis — mis
      // explicitement à NULL.
      data: { ...data, IDDECHETS: data.IDDECHETS ?? null },
      select: marchandiseSelect,
    });
    return mapMarchandise(marchandise);
  }

  async updateMarchandise(id: bigint, dto: UpdateMarchandiseDto) {
    const marchandise = await this.prisma.marchandise.update({
      where: { IDMARCHANDISES: id },
      data: toMarchandiseData(dto),
      select: marchandiseSelect,
    });
    return mapMarchandise(marchandise);
  }

  async deleteMarchandise(id: bigint) {
    await this.prisma.marchandise.delete({ where: { IDMARCHANDISES: id } });
  }
}

// Convertit un enregistrement Marchandise renvoyé par Prisma (create/update)
// vers le format JSON (BigInt → string) — même conversion que
// getMarchandises() mais pour un seul enregistrement.
function mapMarchandise(marchandise: Prisma.MarchandiseGetPayload<{ select: typeof marchandiseSelect }>) {
  return {
    ...marchandise,
    IDMARCHANDISES: marchandise.IDMARCHANDISES.toString(),
    CouleurPlanning: marchandise.CouleurPlanning?.toString() ?? null,
    IDDECHETS: marchandise.IDDECHETS?.toString() ?? null,
  };
}

// Convertit le DTO (CouleurPlanning/IDDECHETS en string) vers le format
// attendu par Prisma (BigInt).
function toMarchandiseData(dto: CreateMarchandiseDto | UpdateMarchandiseDto) {
  return {
    Nom_marchandise: dto.Nom_marchandise,
    CouleurPlanning: dto.CouleurPlanning ? BigInt(dto.CouleurPlanning) : undefined,
    IDDECHETS: dto.IDDECHETS ? BigInt(dto.IDDECHETS) : undefined,
  };
}
