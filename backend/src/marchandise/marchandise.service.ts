// ===== MODEL (logique métier) =====
// Va chercher toutes les marchandises via Prisma. Appelé uniquement par
// MarchandiseController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { toOptionalId } from '../common/blank-to-null.js';
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

// Select complet pour GET /marchandises/:id — ajoute les deux champs
// scripturables absents de marchandiseSelect (celui-ci contient déjà le
// déchet lié en entier, utilisé aussi bien par la liste que le détail).
export const marchandiseDetailSelect = {
  ...marchandiseSelect,
  Is_dechet: true,
  Archive: true,
} satisfies Prisma.MarchandiseSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const marchandiseProjections: ProjectionMap<Prisma.MarchandiseWhereInput> = {
  commandes: (ids) => ({ Prestations: { some: { Commandes: { some: { IDCOMMANDES: { in: ids } } } } } }),
};

@Injectable()
export class MarchandiseService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getMarchandises(page?: number, pageSize?: number, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.MarchandiseWhereInput>(search, (c) => [
      { Nom_marchandise: c },
      { Dechet: { Description_dechet: c } },
      { Dechet: { Code: c } },
    ]);
    const where = andWhere<Prisma.MarchandiseWhereInput>(filterWhere, projectionWhere(marchandiseProjections, projection));
    const [marchandises, total] = await Promise.all([
      this.prisma.marchandise.findMany({
        where,
        orderBy: { IDMARCHANDISES: 'asc' },
        select: marchandiseSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.marchandise.count({ where }),
    ]);
    return { marchandises: serializeBigInt(marchandises), total };
  }

  async getMarchandise(id: bigint) {
    const marchandise = await this.prisma.marchandise.findUniqueOrThrow({
      where: { IDMARCHANDISES: id },
      select: marchandiseDetailSelect,
    });
    return serializeBigInt(marchandise);
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
    return serializeBigInt(marchandise);
  }

  async updateMarchandise(id: bigint, dto: UpdateMarchandiseDto) {
    const marchandise = await this.prisma.marchandise.update({
      where: { IDMARCHANDISES: id },
      data: toMarchandiseData(dto),
      select: marchandiseSelect,
    });
    return serializeBigInt(marchandise);
  }

  async deleteMarchandise(id: bigint) {
    await this.prisma.marchandise.delete({ where: { IDMARCHANDISES: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread. IDDECHETS '' retire le déchet lié (NULL : 0 violerait
// la clé étrangère) ; CouleurPlanning '0' efface la couleur (défaut WinDev).
function toMarchandiseData(dto: CreateMarchandiseDto | UpdateMarchandiseDto) {
  return {
    ...dto,
    CouleurPlanning: dto.CouleurPlanning ? BigInt(dto.CouleurPlanning) : undefined,
    IDDECHETS: toOptionalId(dto.IDDECHETS),
  };
}
