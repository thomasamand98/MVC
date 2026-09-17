// ===== MODEL (logique métier) =====
// Va chercher tous les points via Prisma. Appelé uniquement par
// PointController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePointDto, UpdatePointDto } from './point.dto.js';

export const pointSelect = {
  IDPOINTS: true,
  Libelle: true,
  Nom_societe: true,
  Telephone: true,
  IDADRESSES: true,
  IDSOCIETES: true,
  Adresse: { select: { Adresse1: true, CP: true, Localite: true } },
} satisfies Prisma.PointSelect;

@Injectable()
export class PointService {
  constructor(private readonly prisma: PrismaService) {}

  async getPoints() {
    const points = await this.prisma.point.findMany({
      orderBy: { IDPOINTS: 'asc' },
      select: pointSelect,
    });
    // IDPOINTS/IDADRESSES/IDSOCIETES sont des BigInt (JSON.stringify ne sait
    // pas les sérialiser) → convertis en string pour que la réponse HTTP
    // reste valide.
    return points.map((point) => ({
      ...point,
      IDPOINTS: point.IDPOINTS.toString(),
      IDADRESSES: point.IDADRESSES?.toString() ?? null,
      IDSOCIETES: point.IDSOCIETES?.toString() ?? null,
    }));
  }

  async createPoint(dto: CreatePointDto) {
    const data = toPointData(dto);
    const point = await this.prisma.point.create({
      // IDADRESSES/IDSOCIETES/IDCONTACTS_DEFAUTS ont un défaut DB de 0, qui
      // viole leur contrainte de clé étrangère (aucune ligne d'id 0) quand
      // ils sont omis — mis explicitement à NULL.
      data: { ...data, IDADRESSES: data.IDADRESSES ?? null, IDSOCIETES: data.IDSOCIETES ?? null, IDCONTACTS_DEFAUTS: null },
      select: pointSelect,
    });
    return mapPoint(point);
  }

  async updatePoint(id: bigint, dto: UpdatePointDto) {
    const point = await this.prisma.point.update({
      where: { IDPOINTS: id },
      data: toPointData(dto),
      select: pointSelect,
    });
    return mapPoint(point);
  }

  async deletePoint(id: bigint) {
    await this.prisma.point.delete({ where: { IDPOINTS: id } });
  }
}

// Convertit un enregistrement Point renvoyé par Prisma (create/update) vers
// le format JSON (BigInt → string) — même conversion que getPoints() mais
// pour un seul enregistrement.
function mapPoint(point: Prisma.PointGetPayload<{ select: typeof pointSelect }>) {
  return {
    ...point,
    IDPOINTS: point.IDPOINTS.toString(),
    IDADRESSES: point.IDADRESSES?.toString() ?? null,
    IDSOCIETES: point.IDSOCIETES?.toString() ?? null,
  };
}

// Convertit le DTO (IDADRESSES/IDSOCIETES en string) vers le format attendu
// par Prisma (BigInt).
function toPointData(dto: CreatePointDto | UpdatePointDto) {
  return {
    Libelle: dto.Libelle,
    Nom_societe: dto.Nom_societe,
    Telephone: dto.Telephone,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
    IDSOCIETES: dto.IDSOCIETES ? BigInt(dto.IDSOCIETES) : undefined,
  };
}
