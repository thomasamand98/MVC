// ===== MODEL (logique métier) =====
// Va chercher tous les pointages via Prisma. Appelé uniquement par
// PointageController — jamais par la View directement.
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { parseDay } from '../common/params.js';
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

// Feuille de pointage (GET /pointage/feuille) : fiche complète, plus la
// couleur et le caractère « travaillé » du statut pour l'affichage.
const feuilleSelect = {
  ...pointageDetailSelect,
  TypeStatut: { select: { Libelle_generique: true, CouleurStatut: true, Statut_de_travail: true } },
} satisfies Prisma.PointageSelect;

const tauxSelect = {
  Date_application: true,
  Taux_horaire: true,
  Taux_horaire_supplementaire: true,
  Taux_horaire_nuitee: true,
  Taux_nuitee: true,
  Taux_samedi: true,
  Taux_cheque_repas: true,
  Taux_stanby: true,
} satisfies Prisma.TauxHoraireContratTravailSelect;

// Au-delà, la feuille devient illisible (même ordre de grandeur qu'un mois
// ou deux).
const MAX_FEUILLE_DAYS = 93;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const pointageProjections: ProjectionMap<Prisma.PointageWhereInput> = {
  personnel: (ids) => ({ IDPERSONNELS: { in: ids } }),
};

@Injectable()
export class PointageService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getPointages(page?: number, pageSize?: number, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.PointageWhereInput>(search, (c) => [
      { Personnel: { Nom_Personnel: c } },
      { Personnel: { Prenom_Personnel: c } },
      { TypeStatut: { Libelle_generique: c } },
      { Remarque: c },
    ]);
    const where = andWhere<Prisma.PointageWhereInput>(filterWhere, projectionWhere(pointageProjections, projection));
    const [pointages, total] = await Promise.all([
      this.prisma.pointage.findMany({
        where,
        orderBy: { IDPOINTAGES: 'asc' },
        select: pointageSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.pointage.count({ where }),
    ]);
    return { pointage: serializeBigInt(pointages), total };
  }

  // Tous les statuts, archivés compris : le formulaire masque les archivés
  // sauf celui déjà porté par le pointage modifié, pour ne pas le perdre.
  async getStatuts() {
    const statuts = await this.prisma.typeStatut.findMany({
      orderBy: [{ Ordre: 'asc' }, { Libelle_generique: 'asc' }],
      select: { IDType_Statut: true, Libelle_generique: true, CouleurStatut: true, Statut_de_travail: true, Archive: true },
    });
    return { statuts: serializeBigInt(statuts) };
  }

  // Pointages d'un salarié du jour `fromRaw` au jour `toRaw` inclus
  // (Date_application est une colonne DATE, représentée à minuit UTC), et
  // le taux horaire en vigueur à la fin de la période : le plus récent de
  // ses contrats de travail dont la date d'application est passée.
  async getFeuille(personnelIdRaw: string, fromRaw: string, toRaw: string) {
    if (!/^\d+$/.test(personnelIdRaw ?? '')) throw new BadRequestException('Salarié invalide.');
    const from = parseDay(fromRaw, 'from');
    const to = parseDay(toRaw, 'to');
    if (to < from) throw new BadRequestException('La fin de la période doit être après son début.');
    if ((to.getTime() - from.getTime()) / 86_400_000 >= MAX_FEUILLE_DAYS) {
      throw new BadRequestException(`La période ne peut pas dépasser ${MAX_FEUILLE_DAYS} jours.`);
    }
    const personnelId = BigInt(personnelIdRaw);

    const [pointages, taux] = await Promise.all([
      this.prisma.pointage.findMany({
        where: { IDPERSONNELS: personnelId, Date_application: { gte: from, lte: to } },
        orderBy: [{ Date_application: 'asc' }, { Date_heure_debut: 'asc' }, { IDPOINTAGES: 'asc' }],
        select: feuilleSelect,
      }),
      this.prisma.tauxHoraireContratTravail.findFirst({
        where: {
          ContratTravail: { IDPERSONNELS: personnelId },
          OR: [{ Date_application: null }, { Date_application: { lte: to } }],
        },
        orderBy: [{ Date_application: 'desc' }, { IDTAUX_HORAIRE: 'desc' }],
        select: tauxSelect,
      }),
    ]);
    return { pointages: serializeBigInt(pointages), taux: taux ? serializeBigInt(taux) : null };
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
        Heure_Stanby: data.Heure_Stanby ?? new Date(0),
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


// Le DTO a les mêmes noms de champs que Prisma — les IDs (BigInt côté
// Prisma, string côté JSON) et les dates / heures sont convertis ici, car
// Prisma n'accepte que des dates ISO complètes et le formulaire envoie :
//   - Date_application : un jour « AAAA-MM-JJ » (colonne DATE → minuit UTC) ;
//   - Date_heure_debut / fin : un instant ISO ;
//   - Heure_* / pauses : « HH:MM », ou un datetime du 01/01/1970 (colonne
//     TIME).
// Un champ vide ("") efface la valeur (NULL). Heure_Stanby n'est pas
// nullable : vide, ou absent à la création, il vaut 00:00.
function toPointageData(dto: CreatePointageDto | UpdatePointageDto) {
  const standby = toTime(dto.Heure_Stanby, 'Heure_Stanby');
  return {
    ...dto,
    IDPERSONNELS: dto.IDPERSONNELS ? BigInt(dto.IDPERSONNELS) : undefined,
    IDType_Statut: dto.IDType_Statut ? BigInt(dto.IDType_Statut) : undefined,
    Date_application: toDay(dto.Date_application),
    Date_heure_debut: toInstant(dto.Date_heure_debut, 'Date_heure_debut'),
    Date_heure_fin: toInstant(dto.Date_heure_fin, 'Date_heure_fin'),
    Heure_coupure: toTime(dto.Heure_coupure, 'Heure_coupure'),
    Heure_liaison: toTime(dto.Heure_liaison, 'Heure_liaison'),
    Heure_nuit: toTime(dto.Heure_nuit, 'Heure_nuit'),
    Heure_jour: toTime(dto.Heure_jour, 'Heure_jour'),
    Debut_pause: toTime(dto.Debut_pause, 'Debut_pause'),
    Fin_Pause: toTime(dto.Fin_Pause, 'Fin_Pause'),
    // NOT NULL : vidé, il revient à 00:00 plutôt que de faire échouer l'écriture.
    Heure_Stanby: standby === null ? new Date(0) : standby,
  };
}

function toDay(raw: string | undefined): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === '') return null;
  return parseDay(raw.slice(0, 10), 'Date_application');
}

function toInstant(raw: string | undefined, field: string): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === '') return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`Date invalide pour « ${field} ».`);
  return date;
}

function toTime(raw: string | undefined, field: string): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === '') return null;
  const hhmm = /^\d{2}:\d{2}(:\d{2})?$/.test(raw) ? `1970-01-01T${raw.length === 5 ? `${raw}:00` : raw}Z` : raw;
  return toInstant(hhmm, field);
}
