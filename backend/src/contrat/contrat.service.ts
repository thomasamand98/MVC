// ===== MODEL (logique métier) =====
// Va chercher tous les contrats via Prisma. Appelé uniquement par
// ContratController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
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

// Select complet pour GET /contrats/:id — tous les champs scripturables du
// contrat, plus le type de facture et la marchandise résolus (au lieu des
// seuls IDTYPES_FACTURE/IDMARCHANDISES).
export const contratDetailSelect = {
  ...contratSelect,
  IDTYPES_FACTURE: true,
  Annee_archivage: true,
  Offre_de_prix: true,
  Note_confidentielle: true,
  Instruction_CMR: true,
  Version_contrat: true,
  Archive: true,
  Reference_client: true,
  Taux_tva: true,
  Qt_client_facturation: true,
  Suivant: true,
  IDMARCHANDISES: true,
  Commissionnaire: true,
  Type_contrat: true,
  Marchandise: { select: { Nom_marchandise: true } },
  TypeFacture: { select: { Nom: true } },
} satisfies Prisma.ContratSelect;

@Injectable()
export class ContratService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  // societeId optionnel : ne renvoie que les contrats de cette société —
  // alimente l'onglet « Contrats / Offres » de la fiche Société
  // (SocieteForm.tsx).
  async getContrats(page?: number, pageSize?: number, societeId?: string) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const where = societeId ? { IDSOCIETES: BigInt(societeId) } : undefined;
    const [contrats, total] = await Promise.all([
      this.prisma.contrat.findMany({
        where,
        orderBy: { IDCONTRATS: 'asc' },
        select: contratSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.contrat.count({ where }),
    ]);
    return { contrats: serializeBigInt(contrats), total };
  }

  async getContrat(id: bigint) {
    const contrat = await this.prisma.contrat.findUniqueOrThrow({
      where: { IDCONTRATS: id },
      select: contratDetailSelect,
    });
    return serializeBigInt(contrat);
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
        IDTYPES_FACTURE: data.IDTYPES_FACTURE ?? null,
        IDMARCHANDISES: data.IDMARCHANDISES ?? null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: contratSelect,
    });
    return serializeBigInt(contrat);
  }

  async updateContrat(id: bigint, dto: UpdateContratDto) {
    const contrat = await this.prisma.contrat.update({
      where: { IDCONTRATS: id },
      data: toContratData(dto),
      select: contratSelect,
    });
    return serializeBigInt(contrat);
  }

  async deleteContrat(id: bigint) {
    await this.prisma.contrat.delete({ where: { IDCONTRATS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les champs dont le
// format JSON diffère (BigInt/Date) ont besoin d'être convertis, le reste
// passe tel quel via le spread. Taux_tva (Decimal côté Prisma) accepte
// directement une string, donc rien à convertir pour lui.
function toContratData(dto: CreateContratDto | UpdateContratDto) {
  return {
    ...dto,
    Date_debut: dto.Date_debut ? new Date(dto.Date_debut) : undefined,
    Date_fin: dto.Date_fin ? new Date(dto.Date_fin) : undefined,
    IDSOCIETES: dto.IDSOCIETES ? BigInt(dto.IDSOCIETES) : undefined,
    IDTYPES_FACTURE: dto.IDTYPES_FACTURE ? BigInt(dto.IDTYPES_FACTURE) : undefined,
    IDMARCHANDISES: dto.IDMARCHANDISES ? BigInt(dto.IDMARCHANDISES) : undefined,
  };
}
