// ===== MODEL (logique métier) =====
// Va chercher tous les véhicules via Prisma. Appelé uniquement par
// VehiculeController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateVehiculeDto, UpdateVehiculeDto } from './vehicule.dto.js';
import { blankToNull, toOptionalId } from '../common/blank-to-null.js';

export const vehiculeSelect = {
  IDVEHICULES: true,
  Num_immat: true,
  Type: true,
  Marque: true,
  Modele: true,
  IDSOCIETES: true,
  Societe: { select: { Nom_societe: true } },
  Num_police_assurance: true,
  Num_chassis: true,
  Date_validite_assurance: true,
  Num_licence_transport: true,
  Date_validite_licence: true,
  Date_inspection_auto: true,
  Date_validite_tachygeaphe: true,
} satisfies Prisma.VehiculeSelect;

// Select complet pour GET /vehicules/:id — ajoute les champs scripturables
// absents de vehiculeSelect (celui-ci contient déjà toutes les colonnes du
// tableau).
export const vehiculeDetailSelect = {
  ...vehiculeSelect,
  Date_modification_licence: true,
  Date_radiation_immatriculation: true,
  Date_vente: true,
  Date_premiere_mise_en_circulation: true,
  Avec_compresseur: true,
} satisfies Prisma.VehiculeSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const vehiculeProjections: ProjectionMap<Prisma.VehiculeWhereInput> = {
  societes: (ids) => ({ IDSOCIETES: { in: ids } }),
  // Depuis « attelages » : voir attelageProjectionWhere (requête préalable,
  // pas de relation Prisma vers attelages_reference).
};

@Injectable()
export class VehiculeService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getVehicules(page?: number, pageSize?: number, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.VehiculeWhereInput>(search, (c) => [
      { Num_immat: c },
      { Marque: c },
      { Modele: c },
      { Societe: { Nom_societe: c } },
      { Num_police_assurance: c },
      { Num_chassis: c },
      { Num_licence_transport: c },
    ]);
    const projWhere = projection?.via === 'attelages' ? await this.attelageProjectionWhere(projection.ids) : projectionWhere(vehiculeProjections, projection);
    const where = andWhere<Prisma.VehiculeWhereInput>(filterWhere, projWhere);
    const [vehicules, total] = await Promise.all([
      this.prisma.vehicule.findMany({
        where,
        orderBy: { IDVEHICULES: 'asc' },
        select: vehiculeSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.vehicule.count({ where }),
    ]);
    return { vehicules: serializeBigInt(vehicules), total };
  }

  // Projection depuis des attelages de référence : leurs tracteurs et
  // remorques. IDTRACTEUR/IDREMORQUE n'ont pas de relation Prisma, les ids
  // sont donc lus d'abord.
  private async attelageProjectionWhere(ids: bigint[]): Promise<Prisma.VehiculeWhereInput> {
    const attelages = await this.prisma.attelageReference.findMany({
      where: { IDATTELAGE_REFERENCE: { in: ids } },
      select: { IDTRACTEUR: true, IDREMORQUE: true },
    });
    const vehiculeIds = attelages.flatMap((a) => [a.IDTRACTEUR, a.IDREMORQUE]).filter((id): id is bigint => id !== null && id > 0n);
    return { IDVEHICULES: { in: vehiculeIds } };
  }

  async getVehicule(id: bigint) {
    const vehicule = await this.prisma.vehicule.findUniqueOrThrow({
      where: { IDVEHICULES: id },
      select: vehiculeDetailSelect,
    });
    return serializeBigInt(vehicule);
  }

  async createVehicule(dto: CreateVehiculeDto) {
    const data = toVehiculeData(dto);
    const vehicule = await this.prisma.vehicule.create({
      // IDSOCIETES/IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) quand ils sont
      // omis — mis explicitement à NULL.
      data: { ...data, IDSOCIETES: data.IDSOCIETES ?? null, IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
      select: vehiculeSelect,
    });
    return serializeBigInt(vehicule);
  }

  async updateVehicule(id: bigint, dto: UpdateVehiculeDto) {
    const vehicule = await this.prisma.vehicule.update({
      where: { IDVEHICULES: id },
      data: toVehiculeData(dto),
      select: vehiculeSelect,
    });
    return serializeBigInt(vehicule);
  }

  async deleteVehicule(id: bigint) {
    await this.prisma.vehicule.delete({ where: { IDVEHICULES: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seul IDSOCIETES (BigInt
// côté Prisma, string côté JSON) a besoin d'être converti, le reste passe
// tel quel via le spread (les Date_* acceptent directement une string ISO).
// IDSOCIETES '' retire la société (NULL : 0 violerait la clé étrangère).
function toVehiculeData(dto: CreateVehiculeDto | UpdateVehiculeDto) {
  return {
    ...blankToNull(dto, ['Date_validite_assurance', 'Date_validite_licence', 'Date_modification_licence', 'Date_inspection_auto', 'Date_radiation_immatriculation', 'Date_vente', 'Date_premiere_mise_en_circulation', 'Date_validite_tachygeaphe']),
    IDSOCIETES: toOptionalId(dto.IDSOCIETES),
  };
}
