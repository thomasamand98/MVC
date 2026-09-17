// ===== MODEL (logique métier) =====
// Va chercher tous les attelages via Prisma. Appelé uniquement par
// AttelageController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateAttelageDto, UpdateAttelageDto } from './attelage.dto.js';

// Pas de select séparé pour le détail : le modèle Attelage est petit et ce
// select contient déjà tous ses champs scripturables — chauffeur, tracteur,
// remorque et personnel liés sont résolus directement.
export const attelageSelect = {
  IDATTELAGE: true,
  IDCHAUFFEUR: true,
  Chauffeur: { select: { Nom_chauffeur: true } },
  IDTRACTEUR: true,
  Tracteur: { select: { Marque: true, Modele: true, Num_immat: true } },
  IDREMORQUE: true,
  Remorque: { select: { Marque: true, Modele: true, Num_immat: true } },
  IDPERSONNELS: true,
  Personnel: { select: { Nom_Personnel: true, Prenom_Personnel: true } },
  Date_debut: true,
  Date_fin: true,
} satisfies Prisma.AttelageSelect;

@Injectable()
export class AttelageService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getAttelages(page?: number, pageSize?: number) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const [attelages, total] = await Promise.all([
      this.prisma.attelage.findMany({
        orderBy: { IDATTELAGE: 'asc' },
        select: attelageSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.attelage.count(),
    ]);
    return { attelages: serializeBigInt(attelages), total };
  }

  async getAttelage(id: bigint) {
    const attelage = await this.prisma.attelage.findUniqueOrThrow({
      where: { IDATTELAGE: id },
      select: attelageSelect,
    });
    return serializeBigInt(attelage);
  }

  async createAttelage(dto: CreateAttelageDto) {
    const data = toAttelageData(dto);
    const attelage = await this.prisma.attelage.create({
      // IDCHAUFFEUR/IDTRACTEUR/IDREMORQUE/IDPERSONNELS ont un défaut DB de
      // 0, qui viole leur contrainte de clé étrangère (aucune ligne d'id 0)
      // quand ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDCHAUFFEUR: data.IDCHAUFFEUR ?? null,
        IDTRACTEUR: data.IDTRACTEUR ?? null,
        IDREMORQUE: data.IDREMORQUE ?? null,
        IDPERSONNELS: data.IDPERSONNELS ?? null,
      },
      select: attelageSelect,
    });
    return serializeBigInt(attelage);
  }

  async updateAttelage(id: bigint, dto: UpdateAttelageDto) {
    const attelage = await this.prisma.attelage.update({
      where: { IDATTELAGE: id },
      data: toAttelageData(dto),
      select: attelageSelect,
    });
    return serializeBigInt(attelage);
  }

  async deleteAttelage(id: bigint) {
    await this.prisma.attelage.delete({ where: { IDATTELAGE: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread (Date_debut/Date_fin acceptent directement une string
// ISO).
function toAttelageData(dto: CreateAttelageDto | UpdateAttelageDto) {
  return {
    ...dto,
    IDCHAUFFEUR: dto.IDCHAUFFEUR ? BigInt(dto.IDCHAUFFEUR) : undefined,
    IDTRACTEUR: dto.IDTRACTEUR ? BigInt(dto.IDTRACTEUR) : undefined,
    IDREMORQUE: dto.IDREMORQUE ? BigInt(dto.IDREMORQUE) : undefined,
    IDPERSONNELS: dto.IDPERSONNELS ? BigInt(dto.IDPERSONNELS) : undefined,
  };
}
