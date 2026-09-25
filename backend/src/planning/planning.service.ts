// ===== MODEL (logique métier) =====
// Données de l'écran Planning : exécutions de la période, commandes à
// planifier, déchargements en attente et ressources (chauffeurs,
// remorques). Appelé uniquement par PlanningController.
//
// Les formes renvoyées reprennent exactement celles de
// frontend/src/features/planning/types.ts (dates en ISO, ids en string).
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { windevColorToHex } from '../common/windev-color.js';
import type { CreatePlanningExecutionDto, MovePlanningExecutionDto } from './planning.dto.js';

// Au-delà, la requête devient lourde et la grille illisible (même limite
// que le frontend, avec un peu de marge).
const MAX_RANGE_DAYS = 62;
const COMMANDES_LIMIT = 500;
const DECHARGEMENTS_LIMIT = 200;
// Durée par défaut quand ni l'exécution ni sa prestation routière n'en ont.
const DEFAULT_DURATION_MINUTES = 120;
// Couleurs de repli pour une marchandise sans CouleurPlanning.
const FALLBACK_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#64748b', '#a8a26a', '#ec4899'];

const prestationSelect = {
  Prix_unitaire: true,
  Marchandise: { select: { IDMARCHANDISES: true, Nom_marchandise: true, CouleurPlanning: true } },
  PrestationRoutiers: { select: { IDPOINTDEPART: true, IDPOINTARRIVEE: true, Duree: true }, take: 1 },
} satisfies Prisma.PrestationSelect;

const executionSelect = {
  IDEXECUTIONS: true,
  IDCOMMANDES: true,
  IDCHAUFFEUR: true,
  IDTRACTEUR: true,
  IDREMORQUE: true,
  Immat_tracteur: true,
  Immat_remorque: true,
  Date_Execution: true,
  Date_Fin_Execution: true,
  Date_execution_liee: true,
  Duree: true,
  Reference_client: true,
  RefPlanning: true,
  Instruction_planning: true,
  Statut: true,
  Execution_dechargement: true,
  IDEXECUTIONS_LIEE: true,
  Contrat: { select: { Societe: { select: { Nom_societe: true } } } },
  Commande: { select: { NumRef: true, Contrat: { select: { Societe: { select: { Nom_societe: true } } } } } },
  Prestation: { select: prestationSelect },
} satisfies Prisma.ExecutionSelect;

const commandeSelect = {
  IDCOMMANDES: true,
  Date_commande: true,
  NumRef: true,
  QT: true,
  QT_planifie: true,
  Instruction: true,
  Contrat: { select: { Societe: { select: { Nom_societe: true } } } },
  Prestation: { select: prestationSelect },
} satisfies Prisma.CommandeSelect;

type ExecutionRow = Prisma.ExecutionGetPayload<{ select: typeof executionSelect }>;
type CommandeRow = Prisma.CommandeGetPayload<{ select: typeof commandeSelect }>;
type PrestationRow = Prisma.PrestationGetPayload<{ select: typeof prestationSelect }>;

// Tables de correspondance id → libellé, chargées en une requête chacune
// (PrestationRoutier → Point et Execution → Vehicule n'ont pas de relation
// Prisma, les colonnes existent sans clé étrangère).
type Lookups = { points: Map<bigint, string>; immats: Map<bigint, string> };

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanning(fromRaw: string, toRaw: string, jourDebutRaw: string, jourFinRaw: string) {
    const from = parseDate(fromRaw, 'from');
    const to = parseDate(toRaw, 'to');
    if (to <= from) throw new BadRequestException('La fin de la période doit être après son début.');
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
      throw new BadRequestException(`La période ne peut pas dépasser ${MAX_RANGE_DAYS} jours.`);
    }
    // Colonne DATE : Prisma la représente à minuit UTC.
    const jourDebut = parseDate(`${jourDebutRaw}T00:00:00Z`, 'jourDebut');
    const jourFin = parseDate(`${jourFinRaw}T00:00:00Z`, 'jourFin');

    const [executions, dechargements, commandes, chauffeurs, remorquesAttelees] = await Promise.all([
      // Exécutions qui chevauchent la période (une exécution sans date de
      // fin compte si elle commence dans la période).
      this.prisma.execution.findMany({
        where: {
          Date_Execution: { lt: to },
          OR: [{ Date_Fin_Execution: { gt: from } }, { Date_Fin_Execution: null, Date_Execution: { gte: from } }],
        },
        orderBy: { Date_Execution: 'asc' },
        select: executionSelect,
      }),
      // Déchargements pas encore datés : créés au chargement (déchargement
      // différé), ils attendent d'être glissés sur le planning.
      this.prisma.execution.findMany({
        where: { Execution_dechargement: 1, Date_Execution: null },
        orderBy: { IDEXECUTIONS: 'asc' },
        take: DECHARGEMENTS_LIMIT,
        select: executionSelect,
      }),
      this.prisma.commande.findMany({
        where: { Date_commande: { gte: jourDebut, lte: jourFin }, QT: { gt: 0 } },
        orderBy: [{ Date_commande: 'asc' }, { IDCOMMANDES: 'asc' }],
        take: COMMANDES_LIMIT,
        select: commandeSelect,
      }),
      this.prisma.chauffeur.findMany({
        where: { OR: [{ Archive: 0 }, { Archive: null }] },
        orderBy: { Nom_chauffeur: 'asc' },
        select: {
          IDCHAUFFEURS: true,
          IDPERSONNELS: true,
          Nom_chauffeur: true,
          Personnel: { select: { Nom_Personnel: true, Prenom_Personnel: true } },
          Societe: { select: { Nom_societe: true } },
          AttelageReferences: { select: { IDTRACTEUR: true, IDREMORQUE: true }, orderBy: { IDATTELAGE_REFERENCE: 'desc' }, take: 1 },
        },
      }),
      // Remorques : Vehicule.Type n'a pas de correspondance documentée, on
      // retient les véhicules réellement utilisés comme remorque.
      this.prisma.vehicule.findMany({
        where: { AttelagesRemorque: { some: {} } },
        select: { IDVEHICULES: true },
      }),
    ]);

    const references = chauffeurs.map((c) => c.AttelageReferences[0]).filter((r) => r !== undefined);
    const remorqueIds = new Set<bigint>([
      ...remorquesAttelees.map((v) => v.IDVEHICULES),
      ...references.map((r) => r.IDREMORQUE),
      ...executions.map((e) => e.IDREMORQUE),
      ...dechargements.map((e) => e.IDREMORQUE),
    ].filter(isId));
    const lookups = await this.loadLookups(
      [...executions, ...dechargements].map((e) => e.Prestation).concat(commandes.map((c) => c.Prestation)),
      [...executions, ...dechargements].flatMap((e) => [e.IDTRACTEUR, e.IDREMORQUE]).concat(references.flatMap((r) => [r.IDTRACTEUR, r.IDREMORQUE]), [...remorqueIds]),
    );
    const vehicules = await this.prisma.vehicule.findMany({
      where: { IDVEHICULES: { in: [...remorqueIds] } },
      orderBy: { Num_immat: 'asc' },
      select: { IDVEHICULES: true, Num_immat: true, Marque: true, Modele: true },
    });

    return {
      chauffeurs: chauffeurs.map((c) => {
        const reference = c.AttelageReferences[0];
        const personnel = c.Personnel ? [c.Personnel.Prenom_Personnel, c.Personnel.Nom_Personnel].filter(Boolean).join(' ') : '';
        return {
          id: c.IDCHAUFFEURS.toString(),
          nom: c.Nom_chauffeur?.trim() || personnel || `Chauffeur ${c.IDCHAUFFEURS}`,
          // Chauffeur sans fiche Personnel = chauffeur d'un sous-traitant.
          sousTraitant: isId(c.IDPERSONNELS) ? null : (c.Societe?.Nom_societe ?? null),
          remorqueParDefautId: reference && isId(reference.IDREMORQUE) ? reference.IDREMORQUE.toString() : null,
          tracteurParDefautId: reference && isId(reference.IDTRACTEUR) ? reference.IDTRACTEUR.toString() : null,
          tracteurParDefaut: reference && isId(reference.IDTRACTEUR) ? (lookups.immats.get(reference.IDTRACTEUR) ?? null) : null,
        };
      }),
      remorques: vehicules.map((v) => ({
        id: v.IDVEHICULES.toString(),
        immat: v.Num_immat ?? `Véhicule ${v.IDVEHICULES}`,
        type: [v.Marque, v.Modele].filter(Boolean).join(' ') || 'Remorque',
      })),
      executions: executions.map((e) => toExecution(e, lookups)),
      dechargements: dechargements.map((e) => toDechargement(e, lookups)),
      commandes: commandes.map((c) => toCommande(c, lookups)),
    };
  }

  // Déplacement ou redimensionnement d'une carte : nouvelles dates, et
  // nouvelle ligne (chauffeur ou remorque) si elle a changé.
  async moveExecution(idRaw: string, dto: MovePlanningExecutionDto) {
    const id = parseId(idRaw);
    const start = parseDate(dto.start, 'start');
    const end = parseDate(dto.end, 'end');
    if (end <= start) throw new BadRequestException("La fin de l'exécution doit être après son début.");

    const existing = await this.prisma.execution.findUnique({ where: { IDEXECUTIONS: id }, select: { Facture: true, IDFACTURES: true } });
    if (!existing) throw new NotFoundException('Exécution introuvable.');
    if (isInvoiced(existing)) throw new ConflictException('Exécution déjà facturée : elle ne peut plus être déplacée.');

    const data: Prisma.ExecutionUncheckedUpdateInput = {
      Date_Execution: start,
      Date_Fin_Execution: end,
      Date_heure_modification: new Date(),
    };
    if (dto.chauffeurId !== undefined) {
      data.IDCHAUFFEUR = dto.chauffeurId ? parseId(dto.chauffeurId) : null;
    }
    if (dto.remorqueId !== undefined) {
      const remorqueId = dto.remorqueId ? parseId(dto.remorqueId) : null;
      data.IDREMORQUE = remorqueId ?? 0n;
      data.Immat_remorque = remorqueId ? await this.immatOf(remorqueId) : null;
    }

    const updated = await this.prisma.execution.update({ where: { IDEXECUTIONS: id }, data, select: executionSelect });
    return toExecution(updated, await this.loadLookups([updated.Prestation], [updated.IDTRACTEUR, updated.IDREMORQUE]));
  }

  // Commande déposée sur le planning : nouvelle exécution, et une unité de
  // plus planifiée sur la commande.
  async createExecution(dto: CreatePlanningExecutionDto) {
    const commandeId = parseId(dto.commandeId);
    const start = parseDate(dto.start, 'start');
    const end = parseDate(dto.end, 'end');
    if (end <= start) throw new BadRequestException("La fin de l'exécution doit être après son début.");
    const chauffeurId = dto.chauffeurId ? parseId(dto.chauffeurId) : null;
    const tracteurId = dto.tracteurId ? parseId(dto.tracteurId) : null;
    const remorqueId = dto.remorqueId ? parseId(dto.remorqueId) : null;
    const [immatTracteur, immatRemorque] = await Promise.all([
      tracteurId ? this.immatOf(tracteurId) : null,
      remorqueId ? this.immatOf(remorqueId) : null,
    ]);

    const created = await this.prisma.$transaction(async (tx) => {
      const commande = await tx.commande.findUnique({
        where: { IDCOMMANDES: commandeId },
        select: { IDCONTRATS: true, IDPRESTATIONS: true, QT: true, QT_planifie: true, NumRef: true },
      });
      if (!commande) throw new NotFoundException('Commande introuvable.');
      const planifie = commande.QT_planifie ?? 0;
      if (planifie >= (commande.QT ?? 0)) throw new ConflictException('Cette commande est déjà entièrement planifiée.');

      await tx.commande.update({ where: { IDCOMMANDES: commandeId }, data: { QT_planifie: planifie + 1 } });
      const now = new Date();
      return tx.execution.create({
        // Les colonnes à clé étrangère ont un défaut DB de 0, qui viole la
        // contrainte (aucune ligne d'id 0) : mises explicitement à NULL.
        data: {
          IDCOMMANDES: commandeId,
          IDCONTRATS: isId(commande.IDCONTRATS) ? commande.IDCONTRATS : null,
          IDPRESTATIONS: isId(commande.IDPRESTATIONS) ? commande.IDPRESTATIONS : null,
          IDCHAUFFEUR: chauffeurId,
          IDTRACTEUR: tracteurId ?? 0n,
          IDREMORQUE: remorqueId ?? 0n,
          Immat_tracteur: immatTracteur,
          Immat_remorque: immatRemorque,
          Date_Execution: start,
          Date_Fin_Execution: end,
          Reference_client: commande.NumRef && commande.NumRef !== '0' ? commande.NumRef : null,
          IDSOCIETES_FOURNISSEUR: null,
          IDFACTURES: null,
          IDUTILISATEURS_createur: null,
          IDUTILISATEURS_modificateur: null,
          Date_heure_creation: now,
          Date_heure_modification: now,
        },
        select: executionSelect,
      });
    });

    return toExecution(created, await this.loadLookups([created.Prestation], [created.IDTRACTEUR, created.IDREMORQUE]));
  }

  // « Retirer du planning » : supprime l'exécution et libère l'unité
  // correspondante sur la commande.
  async deleteExecution(idRaw: string) {
    const id = parseId(idRaw);
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.execution.findUnique({
        where: { IDEXECUTIONS: id },
        select: { IDCOMMANDES: true, Facture: true, IDFACTURES: true, _count: { select: { BonExecutions: true, ExecutionSupplementaires: true } } },
      });
      if (!existing) throw new NotFoundException('Exécution introuvable.');
      if (isInvoiced(existing)) throw new ConflictException('Exécution déjà facturée : elle ne peut pas être retirée du planning.');
      if (existing._count.BonExecutions > 0 || existing._count.ExecutionSupplementaires > 0) {
        throw new ConflictException('Exécution liée à des bons ou prestations supplémentaires : retirez-les avant de la supprimer.');
      }

      await tx.execution.delete({ where: { IDEXECUTIONS: id } });
      if (isId(existing.IDCOMMANDES)) {
        const commande = await tx.commande.findUnique({ where: { IDCOMMANDES: existing.IDCOMMANDES }, select: { QT_planifie: true } });
        if (commande) {
          await tx.commande.update({ where: { IDCOMMANDES: existing.IDCOMMANDES }, data: { QT_planifie: Math.max(0, (commande.QT_planifie ?? 0) - 1) } });
        }
      }
    });
  }

  private async immatOf(vehiculeId: bigint): Promise<string | null> {
    const vehicule = await this.prisma.vehicule.findUnique({ where: { IDVEHICULES: vehiculeId }, select: { Num_immat: true } });
    if (!vehicule) throw new NotFoundException('Véhicule introuvable.');
    return vehicule.Num_immat;
  }

  private async loadLookups(prestations: (PrestationRow | null)[], vehiculeIds: (bigint | null)[]): Promise<Lookups> {
    const pointIds = new Set<bigint>();
    for (const routier of prestations.flatMap((p) => p?.PrestationRoutiers ?? [])) {
      if (isId(routier.IDPOINTDEPART)) pointIds.add(routier.IDPOINTDEPART);
      if (isId(routier.IDPOINTARRIVEE)) pointIds.add(routier.IDPOINTARRIVEE);
    }
    const ids = [...new Set(vehiculeIds.filter(isId))];
    const [points, vehicules] = await Promise.all([
      pointIds.size ? this.prisma.point.findMany({ where: { IDPOINTS: { in: [...pointIds] } }, select: { IDPOINTS: true, Libelle: true, Nom_societe: true } }) : [],
      ids.length ? this.prisma.vehicule.findMany({ where: { IDVEHICULES: { in: ids } }, select: { IDVEHICULES: true, Num_immat: true } }) : [],
    ]);
    return {
      points: new Map(points.map((p) => [p.IDPOINTS, p.Libelle?.trim() || p.Nom_societe?.trim() || `Point ${p.IDPOINTS}`])),
      immats: new Map(vehicules.filter((v) => v.Num_immat).map((v) => [v.IDVEHICULES, v.Num_immat as string])),
    };
  }
}

// --- Conversions vers les formes du frontend ------------------------------

function toExecution(e: ExecutionRow, lookups: Lookups) {
  const start = e.Date_Execution as Date;
  const minutes = timeToMinutes(e.Duree) || timeToMinutes(e.Prestation?.PrestationRoutiers[0]?.Duree) || DEFAULT_DURATION_MINUTES;
  const end = e.Date_Fin_Execution && e.Date_Fin_Execution > start ? e.Date_Fin_Execution : new Date(start.getTime() + minutes * 60_000);
  return {
    id: e.IDEXECUTIONS.toString(),
    commandeId: isId(e.IDCOMMANDES) ? e.IDCOMMANDES.toString() : null,
    chauffeurId: isId(e.IDCHAUFFEUR) ? e.IDCHAUFFEUR.toString() : null,
    remorqueId: isId(e.IDREMORQUE) ? e.IDREMORQUE.toString() : null,
    tracteur: (isId(e.IDTRACTEUR) ? lookups.immats.get(e.IDTRACTEUR) : null) ?? e.Immat_tracteur ?? null,
    remorqueImmat: (isId(e.IDREMORQUE) ? lookups.immats.get(e.IDREMORQUE) : null) ?? e.Immat_remorque ?? null,
    start: start.toISOString(),
    end: end.toISOString(),
    ...describe(e, lookups),
    statut: toStatut(e.Statut),
    nature: e.Execution_dechargement === 1 ? 'dechargement' : isId(e.IDEXECUTIONS_LIEE) ? 'chargement' : 'complete',
    montant: toNumber(e.Prestation?.Prix_unitaire),
    refPlanning: e.RefPlanning ?? '',
    instruction: e.Instruction_planning || null,
  };
}

function toDechargement(e: ExecutionRow, lookups: Lookups) {
  return {
    id: e.IDEXECUTIONS.toString(),
    ...describe(e, lookups),
    tracteur: (isId(e.IDTRACTEUR) ? lookups.immats.get(e.IDTRACTEUR) : null) ?? e.Immat_tracteur ?? null,
    remorqueId: isId(e.IDREMORQUE) ? e.IDREMORQUE.toString() : null,
    remorqueImmat: (isId(e.IDREMORQUE) ? lookups.immats.get(e.IDREMORQUE) : null) ?? e.Immat_remorque ?? null,
    chauffeurId: isId(e.IDCHAUFFEUR) ? e.IDCHAUFFEUR.toString() : null,
    dateChargement: e.Date_execution_liee?.toISOString() ?? null,
    dureeMinutes: timeToMinutes(e.Duree) || timeToMinutes(e.Prestation?.PrestationRoutiers[0]?.Duree) || DEFAULT_DURATION_MINUTES,
    montant: toNumber(e.Prestation?.Prix_unitaire),
  };
}

function toCommande(c: CommandeRow, lookups: Lookups) {
  const { depart, arrivee } = route(c.Prestation, lookups);
  return {
    id: c.IDCOMMANDES.toString(),
    numero: c.IDCOMMANDES.toString(),
    date: c.Date_commande?.toISOString() ?? null,
    client: c.Contrat?.Societe?.Nom_societe ?? 'Client inconnu',
    marchandise: toMarchandise(c.Prestation),
    reference: c.NumRef && c.NumRef !== '0' ? c.NumRef : null,
    depart,
    arrivee,
    qt: c.QT ?? 0,
    qtPlanifie: c.QT_planifie ?? 0,
    dureeMinutes: timeToMinutes(c.Prestation?.PrestationRoutiers[0]?.Duree) || DEFAULT_DURATION_MINUTES,
    prixUnitaire: toNumber(c.Prestation?.Prix_unitaire),
    instruction: c.Instruction || null,
  };
}

// Champs communs exécution / déchargement : client, marchandise, trajet.
function describe(e: ExecutionRow, lookups: Lookups) {
  return {
    client: e.Contrat?.Societe?.Nom_societe ?? e.Commande?.Contrat?.Societe?.Nom_societe ?? 'Client inconnu',
    marchandise: toMarchandise(e.Prestation),
    reference: e.Reference_client || (e.Commande?.NumRef && e.Commande.NumRef !== '0' ? e.Commande.NumRef : null),
    ...route(e.Prestation, lookups),
  };
}

function route(prestation: PrestationRow | null, lookups: Lookups) {
  const routier = prestation?.PrestationRoutiers[0];
  const label = (id: bigint | null | undefined) => (isId(id) ? (lookups.points.get(id) ?? '—') : '—');
  return { depart: label(routier?.IDPOINTDEPART), arrivee: label(routier?.IDPOINTARRIVEE) };
}

function toMarchandise(prestation: PrestationRow | null) {
  const m = prestation?.Marchandise;
  if (!m) return { id: '0', nom: 'Sans marchandise', couleur: '#94a3b8' };
  return {
    id: m.IDMARCHANDISES.toString(),
    nom: m.Nom_marchandise ?? 'Sans nom',
    couleur: windevColorToHex(m.CouleurPlanning) ?? FALLBACK_COLORS[Number(m.IDMARCHANDISES % BigInt(FALLBACK_COLORS.length))],
  };
}

// Statut en texte libre (pas de liste fixée) : on en déduit l'état affiché
// sans jamais le réécrire.
function toStatut(statut: string | null): 'planifie' | 'en_cours' | 'termine' {
  const s = (statut ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (s.includes('cours')) return 'en_cours';
  if (s.includes('termin') || s.includes('realis') || s.includes('effectu') || s.includes('livr')) return 'termine';
  return 'planifie';
}

// Colonne TIME : Prisma la renvoie comme une date du 1er janvier 1970 (UTC).
function timeToMinutes(time: Date | null | undefined): number {
  return time ? time.getUTCHours() * 60 + time.getUTCMinutes() : 0;
}

function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? Number(value.toString()) : 0;
}

// Les colonnes d'id héritées de WinDev valent 0 (et non NULL) quand elles
// sont vides.
function isId(value: bigint | null | undefined): value is bigint {
  return value !== null && value !== undefined && value > 0n;
}

function isInvoiced(e: { Facture: number | null; IDFACTURES: bigint | null }): boolean {
  return e.Facture === 1 || isId(e.IDFACTURES);
}

function parseId(raw: string): bigint {
  if (!/^\d+$/.test(raw ?? '')) throw new BadRequestException(`Identifiant invalide : ${raw}`);
  return BigInt(raw);
}

function parseDate(raw: string | undefined, field: string): Date {
  const date = new Date(raw ?? '');
  if (!raw || Number.isNaN(date.getTime())) throw new BadRequestException(`Date invalide pour « ${field} ».`);
  return date;
}
