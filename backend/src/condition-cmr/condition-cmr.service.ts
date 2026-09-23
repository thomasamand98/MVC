// ===== MODEL (logique métier) =====
// Conditions CMR d'un contrat (table conditions_cmr) : lignes « libellé +
// case à cocher » affichées dans la fiche contrat. Appelé uniquement par
// ConditionCmrController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateConditionCmrDto, UpdateConditionCmrDto } from './condition-cmr.dto.js';

// Partagé avec ContratService (contratDetailSelect) pour que la fiche contrat
// et cette API renvoient exactement la même forme.
export const conditionCmrSelect = {
  IDCONDITIONS_CMR: true,
  Libelle: true,
  Boite_a_cocher: true,
} satisfies Prisma.ConditionCmrSelect;

@Injectable()
export class ConditionCmrService {
  constructor(private readonly prisma: PrismaService) {}

  async createConditionCmr(dto: CreateConditionCmrDto) {
    const conditionCmr = await this.prisma.conditionCmr.create({
      // IDUTILISATEURS_createur/modificateur ont un défaut DB de 0, qui viole
      // leur contrainte de clé étrangère (aucun utilisateur d'id 0) quand ils
      // sont omis — mis explicitement à NULL (pas encore d'authentification
      // pour les renseigner).
      data: {
        ...dto,
        IDCONTRATS: dto.IDCONTRATS ? BigInt(dto.IDCONTRATS) : null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
        Date_heure_creation: new Date(),
        Date_heure_modification: new Date(),
      },
      select: conditionCmrSelect,
    });
    return serializeBigInt(conditionCmr);
  }

  async updateConditionCmr(id: bigint, dto: UpdateConditionCmrDto) {
    const conditionCmr = await this.prisma.conditionCmr.update({
      where: { IDCONDITIONS_CMR: id },
      data: { ...dto, Date_heure_modification: new Date() },
      select: conditionCmrSelect,
    });
    return serializeBigInt(conditionCmr);
  }

  async deleteConditionCmr(id: bigint) {
    await this.prisma.conditionCmr.delete({ where: { IDCONDITIONS_CMR: id } });
  }
}
