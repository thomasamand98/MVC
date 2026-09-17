// ===== MODEL (logique métier) =====
// Va chercher toutes les sociétés via Prisma. Appelé uniquement par
// SocieteController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateSocieteDto, UpdateSocieteDto } from './societe.dto.js';

export const societeSelect = {
  IDSOCIETES: true,
  Nom_societe: true,
  Denomination: true,
  TVA: true,
  Activite: true,
  Site_web: true,
} satisfies Prisma.SocieteSelect;

// Select complet pour GET /societes/:id — tous les champs scripturables de
// la société, plus l'adresse résolue (Adresse1/CP/Localite au lieu du seul
// IDADRESSES) et la totalité des contacts rattachés (table de jointure
// SocieteContacts).
export const societeDetailSelect = {
  ...societeSelect,
  Note: true,
  IDADRESSES: true,
  IDCLIENTS: true,
  IDFOURNISSEURS: true,
  Prospect: true,
  Archive: true,
  Adresse: { select: { Adresse1: true, CP: true, Localite: true } },
  SocieteContacts: {
    select: {
      Type_lien: true,
      Fonction_contact: true,
      Service_bureau: true,
      Contact: { select: { Nom_contact: true, Prenom_contact: true } },
    },
  },
} satisfies Prisma.SocieteSelect;

@Injectable()
export class SocietesService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getSocietes(page?: number, pageSize?: number) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const [societes, total] = await Promise.all([
      this.prisma.societe.findMany({
        orderBy: { IDSOCIETES: 'asc' },
        select: societeSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.societe.count(),
    ]);
    return { societes: serializeBigInt(societes), total };
  }

  async getSociete(id: bigint) {
    const societe = await this.prisma.societe.findUniqueOrThrow({
      where: { IDSOCIETES: id },
      select: societeDetailSelect,
    });
    return serializeBigInt(societe);
  }

  async createSociete(dto: CreateSocieteDto) {
    const data = toSocieteData(dto);
    const societe = await this.prisma.societe.create({
      // IDADRESSES/IDCLIENTS/IDFOURNISSEURS/IDUTILISATEURS_* ont un défaut DB
      // de 0, qui viole leur contrainte de clé étrangère (aucune ligne d'id
      // 0) quand ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDADRESSES: data.IDADRESSES ?? null,
        IDCLIENTS: data.IDCLIENTS ?? null,
        IDFOURNISSEURS: data.IDFOURNISSEURS ?? null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: societeSelect,
    });
    return serializeBigInt(societe);
  }

  async updateSociete(id: bigint, dto: UpdateSocieteDto) {
    const societe = await this.prisma.societe.update({
      where: { IDSOCIETES: id },
      data: toSocieteData(dto),
      select: societeSelect,
    });
    return serializeBigInt(societe);
  }

  async deleteSociete(id: bigint) {
    await this.prisma.societe.delete({ where: { IDSOCIETES: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread.
function toSocieteData(dto: CreateSocieteDto | UpdateSocieteDto) {
  return {
    ...dto,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
    IDCLIENTS: dto.IDCLIENTS ? BigInt(dto.IDCLIENTS) : undefined,
    IDFOURNISSEURS: dto.IDFOURNISSEURS ? BigInt(dto.IDFOURNISSEURS) : undefined,
  };
}
