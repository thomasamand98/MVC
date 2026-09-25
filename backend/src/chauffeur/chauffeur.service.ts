// ===== MODEL (logique métier) =====
// Va chercher tous les chauffeurs via Prisma. Appelé uniquement par
// ChauffeurController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { toOptionalId } from '../common/blank-to-null.js';
import { CreateChauffeurDto, UpdateChauffeurDto } from './chauffeur.dto.js';

// Pas de select séparé pour le détail : le modèle Chauffeur est petit et ce
// select contient déjà tous ses champs scripturables — la société et le
// personnel liés sont résolus directement (colonnes "Société"/"Lien
// personnel" du tableau).
export const chauffeurSelect = {
  IDCHAUFFEURS: true,
  Nom_chauffeur: true,
  Categorie: true,
  Telephone: true,
  Archive: true,
  IDSOCIETES: true,
  Societe: { select: { Nom_societe: true } },
  IDPERSONNELS: true,
  Personnel: { select: { Nom_Personnel: true, Prenom_Personnel: true, E_mail_professionnel: true } },
} satisfies Prisma.ChauffeurSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const chauffeurProjections: ProjectionMap<Prisma.ChauffeurWhereInput> = {
  societes: (ids) => ({ IDSOCIETES: { in: ids } }),
  personnel: (ids) => ({ IDPERSONNELS: { in: ids } }),
  attelages: (ids) => ({ AttelageReferences: { some: { IDATTELAGE_REFERENCE: { in: ids } } } }),
};

@Injectable()
export class ChauffeurService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getChauffeurs(page?: number, pageSize?: number, search?: string, projection?: Projection, archiveWhere?: Prisma.ChauffeurWhereInput) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.ChauffeurWhereInput>(search, (c) => [
      { Nom_chauffeur: c },
      { Categorie: c },
      { Telephone: c },
      { Societe: { Nom_societe: c } },
      { Personnel: { Nom_Personnel: c } },
      { Personnel: { Prenom_Personnel: c } },
    ]);
    const where = andWhere<Prisma.ChauffeurWhereInput>(filterWhere, projectionWhere(chauffeurProjections, projection), archiveWhere);
    const [chauffeurs, total] = await Promise.all([
      this.prisma.chauffeur.findMany({
        where,
        orderBy: { IDCHAUFFEURS: 'asc' },
        select: chauffeurSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.chauffeur.count({ where }),
    ]);
    return { chauffeurs: serializeBigInt(chauffeurs), total };
  }

  async getChauffeur(id: bigint) {
    const chauffeur = await this.prisma.chauffeur.findUniqueOrThrow({
      where: { IDCHAUFFEURS: id },
      select: chauffeurSelect,
    });
    return serializeBigInt(chauffeur);
  }

  async createChauffeur(dto: CreateChauffeurDto) {
    const data = toChauffeurData(dto);
    const chauffeur = await this.prisma.chauffeur.create({
      // IDPERSONNELS/IDSOCIETES ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) quand ils sont
      // omis — mis explicitement à NULL.
      data: { ...data, IDPERSONNELS: data.IDPERSONNELS ?? null, IDSOCIETES: data.IDSOCIETES ?? null },
      select: chauffeurSelect,
    });
    return serializeBigInt(chauffeur);
  }

  async updateChauffeur(id: bigint, dto: UpdateChauffeurDto) {
    const chauffeur = await this.prisma.chauffeur.update({
      where: { IDCHAUFFEURS: id },
      data: toChauffeurData(dto),
      select: chauffeurSelect,
    });
    return serializeBigInt(chauffeur);
  }

  async deleteChauffeur(id: bigint) {
    await this.prisma.chauffeur.delete({ where: { IDCHAUFFEURS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread. Un id '' retire le lien (NULL : 0 violerait la clé
// étrangère).
function toChauffeurData(dto: CreateChauffeurDto | UpdateChauffeurDto) {
  return {
    ...dto,
    IDPERSONNELS: toOptionalId(dto.IDPERSONNELS),
    IDSOCIETES: toOptionalId(dto.IDSOCIETES),
  };
}
