// ===== MODEL (logique métier) =====
// Va chercher toutes les conditions d'exécution via Prisma. Appelé
// uniquement par ConditionController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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

  async getConditions() {
    const conditions = await this.prisma.conditionExecution.findMany({
      orderBy: { IDCONDITIONS_EXECUTION: 'asc' },
      select: conditionSelect,
    });
    // IDCONDITIONS_EXECUTION est un BigInt (JSON.stringify ne sait pas le
    // sérialiser) → converti en string pour que la réponse HTTP reste valide.
    return conditions.map((condition) => ({
      ...condition,
      IDCONDITIONS_EXECUTION: condition.IDCONDITIONS_EXECUTION.toString(),
    }));
  }

  async createCondition(dto: CreateConditionDto) {
    const condition = await this.prisma.conditionExecution.create({
      data: dto,
      select: conditionSelect,
    });
    return { ...condition, IDCONDITIONS_EXECUTION: condition.IDCONDITIONS_EXECUTION.toString() };
  }

  async updateCondition(id: bigint, dto: UpdateConditionDto) {
    const condition = await this.prisma.conditionExecution.update({
      where: { IDCONDITIONS_EXECUTION: id },
      data: dto,
      select: conditionSelect,
    });
    return { ...condition, IDCONDITIONS_EXECUTION: condition.IDCONDITIONS_EXECUTION.toString() };
  }

  async deleteCondition(id: bigint) {
    await this.prisma.conditionExecution.delete({ where: { IDCONDITIONS_EXECUTION: id } });
  }
}
