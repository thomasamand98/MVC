// ===== MODEL (logique métier) =====
// Va chercher toutes les conditions d'exécution via Prisma. Appelé
// uniquement par ConditionController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateConditionDto, UpdateConditionDto } from './condition.dto.js';

export const conditionSelect = {
  IDCONDITIONS_EXECUTION: true,
  Type_Prestation: true,
  CMR_or_FDR: true,
  Libelle: true,
} satisfies Prisma.ConditionExecutionSelect;

@Injectable()
export class ConditionService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getConditions(page?: number, pageSize?: number, search?: string) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const where = buildSearchWhere<Prisma.ConditionExecutionWhereInput>(search, (c) => [
      { Libelle: c },
    ]);
    const [conditions, total] = await Promise.all([
      this.prisma.conditionExecution.findMany({
        where,
        orderBy: { IDCONDITIONS_EXECUTION: 'asc' },
        select: conditionSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.conditionExecution.count({ where }),
    ]);
    return { conditions: serializeBigInt(conditions), total };
  }

  // Pas de conditionDetailSelect séparé : conditionSelect contient déjà tous
  // les champs métier du modèle (les seuls autres champs sont des champs
  // d'audit — créateur/modificateur/dates — non exposés). GET /:id ajouté
  // quand même pour garder une API uniforme avec les autres modules.
  async getCondition(id: bigint) {
    const condition = await this.prisma.conditionExecution.findUniqueOrThrow({
      where: { IDCONDITIONS_EXECUTION: id },
      select: conditionSelect,
    });
    return serializeBigInt(condition);
  }

  async createCondition(dto: CreateConditionDto) {
    const condition = await this.prisma.conditionExecution.create({
      data: dto,
      select: conditionSelect,
    });
    return serializeBigInt(condition);
  }

  async updateCondition(id: bigint, dto: UpdateConditionDto) {
    const condition = await this.prisma.conditionExecution.update({
      where: { IDCONDITIONS_EXECUTION: id },
      data: dto,
      select: conditionSelect,
    });
    return serializeBigInt(condition);
  }

  async deleteCondition(id: bigint) {
    await this.prisma.conditionExecution.delete({ where: { IDCONDITIONS_EXECUTION: id } });
  }
}
