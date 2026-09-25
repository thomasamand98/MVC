// ===== MODEL (logique métier) =====
// Va chercher toutes les commandes via Prisma. Appelé uniquement par
// CommandeController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateCommandeDto, UpdateCommandeDto } from './commande.dto.js';
import { blankToNull, toOptionalId } from '../common/blank-to-null.js';

// Pas de select séparé pour le détail : ce select contient déjà tous les
// champs scripturables du modèle Commande. Le "client" (Contrat → Societe)
// est résolu en 2 sauts ; la "marchandise"/"unité" par withMarchandise.
export const commandeSelect = {
  IDCOMMANDES: true,
  Date_commande: true,
  IDCONTRATS: true,
  Contrat: {
    select: {
      Num_contrat: true,
      Version_contrat: true,
      Date_debut: true,
      Date_fin: true,
      Societe: { select: { Nom_societe: true } },
      // Source de la marchandise et de l'unité (voir withMarchandise) :
      // chaque contrat n'a qu'une prestation.
      Prestations: { select: { Unite: true, Marchandise: { select: { Nom_marchandise: true } } }, orderBy: [{ Ordre: 'asc' }, { IDPRESTATIONS: 'asc' }], take: 1 },
    },
  },
  IDPRESTATIONS: true,
  Prestation: { select: { Description_prestation: true } },
  QT: true,
  QT_planifie: true,
  Statut: true,
  NumRef: true,
  Instruction: true,
} satisfies Prisma.CommandeSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const commandeProjections: ProjectionMap<Prisma.CommandeWhereInput> = {
  contrats: (ids) => ({ IDCONTRATS: { in: ids } }),
  marchandises: (ids) => marchandiseWhere({ IDMARCHANDISES: { in: ids } }),
};

@Injectable()
export class CommandeService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getCommandes(page?: number, pageSize?: number, search?: string, projection?: Projection, period?: Prisma.DateTimeNullableFilter) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.CommandeWhereInput>(search, (c) => [
      { NumRef: c },
      { Instruction: c },
      { Contrat: { Num_contrat: c } },
      { Contrat: { Societe: { Nom_societe: c } } },
      marchandiseWhere({ Nom_marchandise: c }),
    ]);
    const where = andWhere<Prisma.CommandeWhereInput>(filterWhere, projectionWhere(commandeProjections, projection), period ? { Date_commande: period } : undefined);
    const [commandes, total] = await Promise.all([
      this.prisma.commande.findMany({
        where,
        orderBy: { IDCOMMANDES: 'asc' },
        select: commandeSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.commande.count({ where }),
    ]);
    return { commandes: serializeBigInt(commandes.map(withMarchandise)), total };
  }

  async getCommande(id: bigint) {
    const commande = await this.prisma.commande.findUniqueOrThrow({
      where: { IDCOMMANDES: id },
      select: commandeSelect,
    });
    return serializeBigInt(withMarchandise(commande));
  }

  async createCommande(dto: CreateCommandeDto) {
    const data = toCommandeData(dto);
    const commande = await this.prisma.commande.create({
      // IDCONTRATS/IDPRESTATIONS/IDUTILISATEURS_* ont un défaut DB de 0, qui
      // viole leur contrainte de clé étrangère (aucune ligne d'id 0) quand
      // ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDCONTRATS: data.IDCONTRATS ?? null,
        IDPRESTATIONS: data.IDPRESTATIONS ?? null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: commandeSelect,
    });
    return serializeBigInt(withMarchandise(commande));
  }

  async updateCommande(id: bigint, dto: UpdateCommandeDto) {
    const commande = await this.prisma.commande.update({
      where: { IDCOMMANDES: id },
      data: toCommandeData(dto),
      select: commandeSelect,
    });
    return serializeBigInt(withMarchandise(commande));
  }

  async deleteCommande(id: bigint) {
    await this.prisma.commande.delete({ where: { IDCOMMANDES: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les IDs (BigInt côté
// Prisma, string côté JSON) ont besoin d'être convertis, le reste passe tel
// quel via le spread (Date_commande accepte directement une string ISO).
function toCommandeData(dto: CreateCommandeDto | UpdateCommandeDto) {
  return {
    ...blankToNull(dto, ['Date_commande']),
    // '' retire le lien (NULL : 0 violerait la clé étrangère).
    IDCONTRATS: toOptionalId(dto.IDCONTRATS),
    IDPRESTATIONS: toOptionalId(dto.IDPRESTATIONS),
  };
}

type CommandeRow = Prisma.CommandeGetPayload<{ select: typeof commandeSelect }>;

// Marchandise et unité d'une commande : toujours celles de la prestation
// de son contrat (commande → contrat → prestation → IDMARCHANDISES / Unite),
// comme dans WinDev. Ajoutées à plat (Marchandise, Unite) ; la prestation
// du contrat, qui n'a servi qu'à ça, est retirée de la réponse.
function withMarchandise(row: CommandeRow) {
  const { Prestations, ...contrat } = row.Contrat ?? { Prestations: [] };
  const prestation = Prestations[0];
  return {
    ...row,
    Contrat: row.Contrat ? contrat : null,
    Marchandise: prestation?.Marchandise ?? null,
    Unite: prestation?.Unite || null,
  };
}

// Même chemin que withMarchandise, pour la recherche et la projection.
function marchandiseWhere(where: Prisma.MarchandiseWhereInput): Prisma.CommandeWhereInput {
  return { Contrat: { Prestations: { some: { Marchandise: where } } } };
}
