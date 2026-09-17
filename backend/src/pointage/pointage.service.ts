// ===== MODEL (logique métier) =====
// Va chercher tous les pointages via Prisma. Appelé uniquement par
// PointageController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreatePointageDto, UpdatePointageDto } from './pointage.dto.js';

export const pointageSelect = {
  IDPOINTAGES: true,
  Date_application: true,
  IDPERSONNELS: true,
  Personnel: { select: { Nom_Personnel: true, Prenom_Personnel: true } },
  Date_heure_debut: true,
  Date_heure_fin: true,
  Heure_coupure: true,
  Heure_nuit: true,
  Heure_liaison: true,
  Heure_Stanby: true,
  IDType_Statut: true,
  TypeStatut: { select: { Libelle_generique: true } },
  Nuitee: true,
  Remarque: true,
} satisfies Prisma.PointageSelect;

// Select complet pour GET /pointage/:id — ajoute les pauses, absentes du
// tableau mais scripturables sur le modèle.
export const pointageDetailSelect = {
  ...pointageSelect,
  Debut_pause: true,
  Fin_Pause: true,
  Heure_jour: true,
} satisfies Prisma.PointageSelect;

@Injectable()
export class PointageService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getPointages(page?: number, pageSize?: number) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const [pointages, total] = await Promise.all([
      this.prisma.pointage.findMany({
        orderBy: { IDPOINTAGES: 'asc' },
        select: pointageSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.pointage.count(),
    ]);
    return { pointage: serializeBigInt(pointages), total };
  }

  async getPointage(id: bigint) {
    const pointage = await this.prisma.pointage.findUniqueOrThrow({
      where: { IDPOINTAGES: id },
      select: pointageDetailSelect,
    });
    return serializeBigInt(pointage);
  }

  async createPointage(dto: CreatePointageDto) {
    const data = toPointageData(dto);
    const pointage = await this.prisma.pointage.create({
      // IDPERSONNELS/IDType_Statut/IDUTILISATEURS_* ont un défaut DB de 0,
      // qui viole leur contrainte de clé étrangère (aucune ligne d'id 0)
      // quand ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDPERSONNELS: data.IDPERSONNELS ?? null,
        IDType_Statut: data.IDType_Statut ?? null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: pointageSelect,
    });
    return serializeBigInt(pointage);
  }

  async updatePointage(id: bigint, dto: UpdatePointageDto) {
    const pointage = await this.prisma.pointage.update({
      where: { IDPOINTAGES: id },
      data: toPointageData(dto),
      select: pointageSelect,
    });
    return serializeBigInt(pointage);
  }

  async deletePointage(id: bigint) {
    await this.prisma.pointage.delete({ where: { IDPOINTAGES: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread (les Date_*/Heure_* acceptent directement une string).
// Heure_Stanby n'est pas nullable côté Prisma (contrainte NOT NULL) — si
// omis, "00:00:00" est envoyé à la place pour ne pas faire échouer la
// requête (à ajuster si un autre comportement par défaut est voulu).
function toPointageData(dto: CreatePointageDto | UpdatePointageDto) {
  return {
    ...dto,
    IDPERSONNELS: dto.IDPERSONNELS ? BigInt(dto.IDPERSONNELS) : undefined,
    IDType_Statut: dto.IDType_Statut ? BigInt(dto.IDType_Statut) : undefined,
    Heure_Stanby: dto.Heure_Stanby || '00:00:00',
  };
}
