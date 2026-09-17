// ===== MODEL (logique métier) =====
// Va chercher toutes les sociétés via Prisma. Appelé uniquement par
// SocieteController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSocieteDto, UpdateSocieteDto } from './societe.dto.js';

export const societeSelect = {
  IDSOCIETES: true,
  Nom_societe: true,
  Denomination: true,
  TVA: true,
  Activite: true,
  Site_web: true,
} satisfies Prisma.SocieteSelect;

@Injectable()
export class SocietesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSocietes() {
    const societes = await this.prisma.societe.findMany({
      orderBy: { IDSOCIETES: 'asc' },
      select: societeSelect,
    });
    // IDSOCIETES est un BigInt (JSON.stringify ne sait pas le sérialiser) →
    // converti en string pour que la réponse HTTP reste valide.
    return societes.map((societe) => ({ ...societe, IDSOCIETES: societe.IDSOCIETES.toString() }));
  }

  async createSociete(dto: CreateSocieteDto) {
    const societe = await this.prisma.societe.create({
      // IDCLIENTS/IDFOURNISSEURS/IDUTILISATEURS_* ont un défaut DB de 0, qui
      // viole leur contrainte de clé étrangère (aucune ligne d'id 0) — il
      // faut les mettre explicitement à NULL plutôt que de laisser le défaut
      // s'appliquer.
      data: { ...dto, IDCLIENTS: null, IDFOURNISSEURS: null, IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
      select: societeSelect,
    });
    return { ...societe, IDSOCIETES: societe.IDSOCIETES.toString() };
  }

  async updateSociete(id: bigint, dto: UpdateSocieteDto) {
    const societe = await this.prisma.societe.update({
      where: { IDSOCIETES: id },
      data: dto,
      select: societeSelect,
    });
    return { ...societe, IDSOCIETES: societe.IDSOCIETES.toString() };
  }

  async deleteSociete(id: bigint) {
    await this.prisma.societe.delete({ where: { IDSOCIETES: id } });
  }
}
