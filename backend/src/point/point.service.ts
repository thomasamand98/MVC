// ===== MODEL (logique métier) =====
// Va chercher tous les points via Prisma. Appelé uniquement par
// PointController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
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

// Select complet pour GET /points/:id — tous les champs scripturables du
// point, plus le contact par défaut résolu et la totalité des contacts
// rattachés (table de jointure PointContacts).
export const pointDetailSelect = {
  ...pointSelect,
  Archive: true,
  Lien_googleMap: true,
  Instruction: true,
  IDCONTACTS_DEFAUTS: true,
  ContactDefauts: { select: { Nom_contact: true, Prenom_contact: true } },
  PointContacts: {
    select: {
      Lien: true,
      Recevoir_Mail_Planning: true,
      Contact: { select: { Nom_contact: true, Prenom_contact: true } },
    },
  },
} satisfies Prisma.PointSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const pointProjections: ProjectionMap<Prisma.PointWhereInput> = {
  societes: (ids) => ({ IDSOCIETES: { in: ids } }),
  contacts: (ids) => ({ PointContacts: { some: { IDCONTACTS: { in: ids } } } }),
};

@Injectable()
export class PointService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getPoints(page?: number, pageSize?: number, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.PointWhereInput>(search, (c) => [
      { Libelle: c },
      { Nom_societe: c },
      { Telephone: c },
      { Adresse: { Adresse1: c } },
      { Adresse: { CP: c } },
      { Adresse: { Localite: c } },
    ]);
    const where = andWhere<Prisma.PointWhereInput>(filterWhere, projectionWhere(pointProjections, projection));
    const [points, total] = await Promise.all([
      this.prisma.point.findMany({
        where,
        orderBy: { IDPOINTS: 'asc' },
        select: pointSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.point.count({ where }),
    ]);
    return { points: serializeBigInt(points), total };
  }

  async getPoint(id: bigint) {
    const point = await this.prisma.point.findUniqueOrThrow({
      where: { IDPOINTS: id },
      select: pointDetailSelect,
    });
    return serializeBigInt(point);
  }

  async createPoint(dto: CreatePointDto) {
    const data = toPointData(dto);
    const point = await this.prisma.point.create({
      // IDADRESSES/IDSOCIETES/IDCONTACTS_DEFAUTS ont un défaut DB de 0, qui
      // viole leur contrainte de clé étrangère (aucune ligne d'id 0) quand
      // ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDADRESSES: data.IDADRESSES ?? null,
        IDSOCIETES: data.IDSOCIETES ?? null,
        IDCONTACTS_DEFAUTS: data.IDCONTACTS_DEFAUTS ?? null,
      },
      select: pointSelect,
    });
    return serializeBigInt(point);
  }

  async updatePoint(id: bigint, dto: UpdatePointDto) {
    const point = await this.prisma.point.update({
      where: { IDPOINTS: id },
      data: toPointData(dto),
      select: pointSelect,
    });
    return serializeBigInt(point);
  }

  async deletePoint(id: bigint) {
    await this.prisma.point.delete({ where: { IDPOINTS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread.
function toPointData(dto: CreatePointDto | UpdatePointDto) {
  return {
    ...dto,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
    IDSOCIETES: dto.IDSOCIETES ? BigInt(dto.IDSOCIETES) : undefined,
    IDCONTACTS_DEFAUTS: dto.IDCONTACTS_DEFAUTS ? BigInt(dto.IDCONTACTS_DEFAUTS) : undefined,
  };
}
