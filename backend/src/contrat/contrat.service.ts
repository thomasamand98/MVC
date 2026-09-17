// ===== MODEL (logique métier) =====
// Va chercher tous les contrats via Prisma. Appelé uniquement par
// ContratController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateContratDto, UpdateContratDto } from './contrat.dto.js';

// Partagé avec ContratEntity pour que le type reflète toujours exactement
// ce que la requête renvoie (voir contrat.entity.ts).
export const contratSelect = {
  IDCONTRATS: true,
  Num_contrat: true,
  Description_projet: true,
  Date_debut: true,
  Date_fin: true,
  IDSOCIETES: true,
  Societe: { select: { Nom_societe: true, TVA: true } },
} satisfies Prisma.ContratSelect;

@Injectable()
export class ContratService {
  constructor(private readonly prisma: PrismaService) {}

  async getContrats() {
    const contrats = await this.prisma.contrat.findMany({
      orderBy: { IDCONTRATS: 'asc' },
      select: contratSelect,
    });
    // IDCONTRATS/IDSOCIETES sont des BigInt (JSON.stringify ne sait pas les
    // sérialiser) → convertis en string pour que la réponse HTTP reste
    // valide.
    return contrats.map((contrat) => ({
      ...contrat,
      IDCONTRATS: contrat.IDCONTRATS.toString(),
      IDSOCIETES: contrat.IDSOCIETES?.toString() ?? null,
    }));
  }

  async createContrat(dto: CreateContratDto) {
    const data = toContratData(dto);
    const contrat = await this.prisma.contrat.create({
      // IDSOCIETES/IDTYPES_FACTURE/IDMARCHANDISES/IDUTILISATEURS_* ont un
      // défaut DB de 0, qui viole leur contrainte de clé étrangère (aucune
      // ligne d'id 0) quand ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDSOCIETES: data.IDSOCIETES ?? null,
        IDTYPES_FACTURE: null,
        IDMARCHANDISES: null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: contratSelect,
    });
    return { ...contrat, IDCONTRATS: contrat.IDCONTRATS.toString(), IDSOCIETES: contrat.IDSOCIETES?.toString() ?? null };
  }

  async updateContrat(id: bigint, dto: UpdateContratDto) {
    const contrat = await this.prisma.contrat.update({
      where: { IDCONTRATS: id },
      data: toContratData(dto),
      select: contratSelect,
    });
    return { ...contrat, IDCONTRATS: contrat.IDCONTRATS.toString(), IDSOCIETES: contrat.IDSOCIETES?.toString() ?? null };
  }

  async deleteContrat(id: bigint) {
    await this.prisma.contrat.delete({ where: { IDCONTRATS: id } });
  }
}

// Convertit le DTO (champs JSON : IDSOCIETES en string, dates en ISO string)
// vers le format attendu par Prisma (BigInt, Date).
function toContratData(dto: CreateContratDto | UpdateContratDto) {
  return {
    Num_contrat: dto.Num_contrat,
    Description_projet: dto.Description_projet,
    Date_debut: dto.Date_debut ? new Date(dto.Date_debut) : undefined,
    Date_fin: dto.Date_fin ? new Date(dto.Date_fin) : undefined,
    IDSOCIETES: dto.IDSOCIETES ? BigInt(dto.IDSOCIETES) : undefined,
  };
}
