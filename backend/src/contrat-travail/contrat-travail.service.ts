// ===== MODEL (logique métier) =====
// Contrats de travail (table contrats_travail) d'un personnel, chacun avec
// l'historique de ses taux horaires (taux_horaire_contrat_travail) : un taux
// s'applique à partir de sa Date_application, le plus récent passé étant en
// vigueur (voir PointageService.getFeuille).
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import type { ContratTravailDto, TauxHoraireDto } from './contrat-travail.dto.js';

const tauxSelect = {
  IDTAUX_HORAIRE: true,
  Date_application: true,
  Taux_horaire: true,
  Taux_horaire_supplementaire: true,
  Taux_horaire_nuitee: true,
  Taux_nuitee: true,
  Taux_samedi: true,
  Taux_cheque_repas: true,
  Taux_stanby: true,
} satisfies Prisma.TauxHoraireContratTravailSelect;

const contratSelect = {
  IDCONTRATS_TRAVAIL: true,
  TypeContrat: true,
  Qualification: true,
  Date_debut: true,
  Date_fin: true,
  Routier: true,
  Manutention: true,
  Atelier: true,
  Societe: { select: { IDSOCIETES: true, Nom_societe: true } },
  TauxHoraireContratTravails: {
    select: tauxSelect,
    orderBy: [{ Date_application: 'desc' }, { IDTAUX_HORAIRE: 'desc' }],
  },
} satisfies Prisma.ContratTravailSelect;

const rateFieldNames = [
  'Taux_horaire',
  'Taux_horaire_supplementaire',
  'Taux_horaire_nuitee',
  'Taux_nuitee',
  'Taux_samedi',
  'Taux_cheque_repas',
  'Taux_stanby',
] as const;

@Injectable()
export class ContratTravailService {
  constructor(private readonly prisma: PrismaService) {}

  // Plus récent en premier.
  async getContrats(personnelId: bigint) {
    const contrats = await this.prisma.contratTravail.findMany({
      where: { IDPERSONNELS: personnelId },
      orderBy: [{ Date_debut: 'desc' }, { IDCONTRATS_TRAVAIL: 'desc' }],
      select: contratSelect,
    });
    return { contrats: serializeBigInt(contrats) };
  }

  async createContrat(personnelId: bigint, dto: ContratTravailDto) {
    const contrat = await this.prisma.contratTravail.create({
      // IDSOCIETES/IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) — mis à NULL.
      data: {
        ...toContratData(dto),
        IDPERSONNELS: personnelId,
        IDSOCIETES: null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
        Date_heure_creation: new Date(),
        TauxHoraireContratTravails: { create: (dto.Taux ?? []).map(newTaux) },
      },
      select: contratSelect,
    });
    return serializeBigInt(contrat);
  }

  // Les taux envoyés remplacent ceux du contrat (voir ContratTravailDto.Taux).
  async updateContrat(id: bigint, dto: ContratTravailDto) {
    const contrat = await this.prisma.$transaction(async (tx) => {
      if (dto.Taux) {
        const existing = await tx.tauxHoraireContratTravail.findMany({ where: { IDCONTRATS_TRAVAIL: id }, select: { IDTAUX_HORAIRE: true } });
        const kept = new Set(dto.Taux.map((t) => t.IDTAUX_HORAIRE).filter(Boolean));
        await deleteTaux(
          tx,
          existing.map((t) => t.IDTAUX_HORAIRE).filter((tauxId) => !kept.has(tauxId.toString())),
        );
        for (const taux of dto.Taux) {
          if (taux.IDTAUX_HORAIRE) {
            await tx.tauxHoraireContratTravail.update({
              where: { IDTAUX_HORAIRE: BigInt(taux.IDTAUX_HORAIRE), IDCONTRATS_TRAVAIL: id },
              data: { ...toTauxData(taux), Date_heure_modification: new Date() },
            });
          } else {
            await tx.tauxHoraireContratTravail.create({ data: { ...newTaux(taux), IDCONTRATS_TRAVAIL: id } });
          }
        }
      }
      return tx.contratTravail.update({
        where: { IDCONTRATS_TRAVAIL: id },
        data: { ...toContratData(dto), Date_heure_modification: new Date() },
        select: contratSelect,
      });
    });
    return serializeBigInt(contrat);
  }

  async deleteContrat(id: bigint) {
    await this.prisma.$transaction(async (tx) => {
      const taux = await tx.tauxHoraireContratTravail.findMany({ where: { IDCONTRATS_TRAVAIL: id }, select: { IDTAUX_HORAIRE: true } });
      await deleteTaux(tx, taux.map((t) => t.IDTAUX_HORAIRE));
      await tx.contratTravail.delete({ where: { IDCONTRATS_TRAVAIL: id } });
    });
  }
}

// Un taux déjà utilisé par un résumé de pointage n'est pas supprimé : la
// paie calculée avec lui en dépend.
async function deleteTaux(tx: Prisma.TransactionClient, ids: bigint[]) {
  if (ids.length === 0) return;
  const used = await tx.pointageResume.count({ where: { IDTAUX_HORAIRE: { in: ids } } });
  if (used > 0) throw new ConflictException('Un taux horaire déjà utilisé par des pointages ne peut pas être supprimé.');
  await tx.tauxHoraireContratTravail.deleteMany({ where: { IDTAUX_HORAIRE: { in: ids } } });
}

// Champs non envoyés (undefined) laissés tels quels ; textes vides → NULL.
function toContratData(dto: ContratTravailDto) {
  return {
    TypeContrat: dto.TypeContrat === undefined ? undefined : dto.TypeContrat.trim() || null,
    Qualification: dto.Qualification === undefined ? undefined : dto.Qualification.trim() || null,
    Date_debut: dto.Date_debut === undefined ? undefined : toDay(dto.Date_debut, 'Date de début'),
    Date_fin: dto.Date_fin === undefined ? undefined : toDay(dto.Date_fin, 'Date de fin'),
    Routier: toFlag(dto.Routier),
    Manutention: toFlag(dto.Manutention),
    Atelier: toFlag(dto.Atelier),
  };
}

function newTaux(dto: TauxHoraireDto) {
  return { ...toTauxData(dto), Date_heure_creation: new Date(), IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null };
}

function toTauxData(dto: TauxHoraireDto) {
  const rates = Object.fromEntries(rateFieldNames.map((field) => [field, toRate(dto[field], field)])) as Record<
    (typeof rateFieldNames)[number],
    Prisma.Decimal
  >;
  return { ...rates, Date_application: toDay(dto.Date_application, 'Date d’application') };
}

function toFlag(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value ? 1 : 0;
}

function toRate(raw: number | string | undefined, field: string): Prisma.Decimal {
  if (raw === undefined || raw === '') return new Prisma.Decimal(0);
  const value = Number(typeof raw === 'string' ? raw.replace(',', '.') : raw);
  if (!Number.isFinite(value) || value < 0) throw new BadRequestException(`Montant invalide pour « ${field} ».`);
  return new Prisma.Decimal(value);
}

function toDay(raw: string | null | undefined, field: string): Date | null {
  if (!raw) return null;
  const day = raw.slice(0, 10);
  const date = new Date(`${day}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Date invalide pour « ${field} ».`);
  }
  return date;
}
