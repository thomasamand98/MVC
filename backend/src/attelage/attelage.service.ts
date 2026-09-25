// ===== MODEL (logique métier) =====
// Attelages de référence (table attelages_reference) : le couple tracteur +
// remorque habituel de chaque chauffeur — celui repris par défaut au
// planning. La table `attelage` (historique daté) n'est plus exposée : elle
// ne contient que d'anciennes lignes de test. Appelé uniquement par
// AttelageController — jamais par la View directement.
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { toOptionalId } from '../common/blank-to-null.js';
import { CreateAttelageDto, UpdateAttelageDto } from './attelage.dto.js';

// Pas de select séparé pour le détail : le modèle est petit et ce select
// contient déjà tous ses champs scripturables. Tracteur/remorque n'ont pas
// de relation Prisma (colonnes sans clé étrangère) : résolus à part par
// withVehicules.
export const attelageSelect = {
  IDATTELAGE_REFERENCE: true,
  IDCHAUFFEUR: true,
  Chauffeur: { select: { Nom_chauffeur: true } },
  IDTRACTEUR: true,
  IDREMORQUE: true,
  IDSOCIETES: true,
  Societe: { select: { Nom_societe: true } },
} satisfies Prisma.AttelageReferenceSelect;

type AttelageRow = Prisma.AttelageReferenceGetPayload<{ select: typeof attelageSelect }>;

const vehiculeSelect = { IDVEHICULES: true, Marque: true, Modele: true, Num_immat: true } satisfies Prisma.VehiculeSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const attelageProjections: ProjectionMap<Prisma.AttelageReferenceWhereInput> = {
  chauffeurs: (ids) => ({ IDCHAUFFEUR: { in: ids } }),
  personnel: (ids) => ({ Chauffeur: { IDPERSONNELS: { in: ids } } }),
  vehicules: (ids) => ({ OR: [{ IDTRACTEUR: { in: ids } }, { IDREMORQUE: { in: ids } }] }),
};

// Un id 0 (défaut WinDev) équivaut à « aucun lien ».
function isId(value: bigint | null | undefined): value is bigint {
  return value !== null && value !== undefined && value > 0n;
}

@Injectable()
export class AttelageService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages. La
  // recherche porte aussi sur les véhicules, via leurs ids (pas de relation).
  async getAttelages(page?: number, pageSize?: number, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = await this.searchWhere(search);
    const where = andWhere<Prisma.AttelageReferenceWhereInput>(filterWhere, projectionWhere(attelageProjections, projection));
    const [attelages, total] = await Promise.all([
      this.prisma.attelageReference.findMany({
        where,
        orderBy: [{ Chauffeur: { Nom_chauffeur: 'asc' } }, { IDATTELAGE_REFERENCE: 'asc' }],
        select: attelageSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.attelageReference.count({ where }),
    ]);
    return { attelages: serializeBigInt(await this.withVehicules(attelages)), total };
  }

  async getAttelage(id: bigint) {
    const attelage = await this.prisma.attelageReference.findUnique({
      where: { IDATTELAGE_REFERENCE: id },
      select: attelageSelect,
    });
    if (!attelage) throw new NotFoundException('Attelage introuvable.');
    const [withVehicules] = await this.withVehicules([attelage]);
    return serializeBigInt(withVehicules);
  }

  async createAttelage(dto: CreateAttelageDto) {
    const data = toAttelageData(dto);
    const attelage = await this.prisma.attelageReference.create({
      // Les IDs ont un défaut DB de 0, qui viole les clés étrangères
      // (aucune ligne d'id 0) quand ils sont omis — mis explicitement à NULL.
      data: {
        IDCHAUFFEUR: data.IDCHAUFFEUR ?? null,
        IDTRACTEUR: data.IDTRACTEUR ?? null,
        IDREMORQUE: data.IDREMORQUE ?? null,
        IDSOCIETES: data.IDSOCIETES ?? null,
        IDPERSONNELS: null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
        Date_heure_creation: new Date(),
      },
      select: attelageSelect,
    });
    const [withVehicules] = await this.withVehicules([attelage]);
    return serializeBigInt(withVehicules);
  }

  async updateAttelage(id: bigint, dto: UpdateAttelageDto) {
    const attelage = await this.prisma.attelageReference.update({
      where: { IDATTELAGE_REFERENCE: id },
      data: { ...toAttelageData(dto), Date_heure_modification: new Date() },
      select: attelageSelect,
    });
    const [withVehicules] = await this.withVehicules([attelage]);
    return serializeBigInt(withVehicules);
  }

  async deleteAttelage(id: bigint) {
    await this.prisma.attelageReference.delete({ where: { IDATTELAGE_REFERENCE: id } });
  }

  // Ajoute Tracteur/Remorque (marque, modèle, immatriculation) à chaque
  // ligne, en une seule requête sur les véhicules.
  private async withVehicules(rows: AttelageRow[]) {
    const ids = [...new Set(rows.flatMap((r) => [r.IDTRACTEUR, r.IDREMORQUE]).filter(isId))];
    const vehicules = ids.length
      ? await this.prisma.vehicule.findMany({ where: { IDVEHICULES: { in: ids } }, select: vehiculeSelect })
      : [];
    const byId = new Map(vehicules.map((v) => [v.IDVEHICULES, { Marque: v.Marque, Modele: v.Modele, Num_immat: v.Num_immat }]));
    return rows.map((r) => ({
      ...r,
      Tracteur: isId(r.IDTRACTEUR) ? (byId.get(r.IDTRACTEUR) ?? null) : null,
      Remorque: isId(r.IDREMORQUE) ? (byId.get(r.IDREMORQUE) ?? null) : null,
    }));
  }

  // Recherche sur le chauffeur, la société et les véhicules : ces derniers
  // sans relation Prisma, les véhicules correspondant à chaque mot sont
  // cherchés d'abord, puis filtrés par id.
  private async searchWhere(search: string | undefined): Promise<Prisma.AttelageReferenceWhereInput | undefined> {
    const terms = search?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (terms.length === 0) return undefined;
    const vehiculeIdsByTerm = await Promise.all(
      terms.map((term) =>
        this.prisma.vehicule
          .findMany({
            where: { OR: [{ Marque: { contains: term } }, { Modele: { contains: term } }, { Num_immat: { contains: term } }] },
            select: { IDVEHICULES: true },
          })
          .then((vs) => vs.map((v) => v.IDVEHICULES)),
      ),
    );
    return buildSearchWhere<Prisma.AttelageReferenceWhereInput>(search, (c) => {
      const ids = vehiculeIdsByTerm[terms.indexOf(c.contains)] ?? [];
      return [
        { Chauffeur: { Nom_chauffeur: c } },
        { Societe: { Nom_societe: c } },
        { IDTRACTEUR: { in: ids } },
        { IDREMORQUE: { in: ids } },
      ];
    });
  }
}

// Seuls les IDs (BigInt côté Prisma, string côté JSON) sont convertis ; ''
// retire le lien (NULL : 0 violerait la clé étrangère).
function toAttelageData(dto: CreateAttelageDto | UpdateAttelageDto) {
  return {
    IDCHAUFFEUR: toOptionalId(dto.IDCHAUFFEUR),
    IDTRACTEUR: toOptionalId(dto.IDTRACTEUR),
    IDREMORQUE: toOptionalId(dto.IDREMORQUE),
    IDSOCIETES: toOptionalId(dto.IDSOCIETES),
  };
}
