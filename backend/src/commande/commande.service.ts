// ===== MODEL (logique métier) =====
// Va chercher toutes les commandes via Prisma. Appelé uniquement par
// CommandeController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateCommandeDto, UpdateCommandeDto } from './commande.dto.js';

// Pas de select séparé pour le détail : ce select contient déjà tous les
// champs scripturables du modèle Commande. Le "client" (Contrat → Societe)
// et la "marchandise"/"unité" (Prestation → Marchandise/Unite) sont résolus
// en 2 sauts, car Commande n'a pas de lien direct vers Societe/Marchandise.
export const commandeSelect = {
  IDCOMMANDES: true,
  Date_commande: true,
  IDCONTRATS: true,
  Contrat: { select: { Num_contrat: true, Societe: { select: { Nom_societe: true } } } },
  IDPRESTATIONS: true,
  Prestation: { select: { Unite: true, Marchandise: { select: { Nom_marchandise: true } } } },
  QT: true,
  QT_planifie: true,
  Statut: true,
  NumRef: true,
  Instruction: true,
} satisfies Prisma.CommandeSelect;

@Injectable()
export class CommandeService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getCommandes(page?: number, pageSize?: number) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const [commandes, total] = await Promise.all([
      this.prisma.commande.findMany({
        orderBy: { IDCOMMANDES: 'asc' },
        select: commandeSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.commande.count(),
    ]);
    return { commandes: serializeBigInt(commandes), total };
  }

  async getCommande(id: bigint) {
    const commande = await this.prisma.commande.findUniqueOrThrow({
      where: { IDCOMMANDES: id },
      select: commandeSelect,
    });
    return serializeBigInt(commande);
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
    return serializeBigInt(commande);
  }

  async updateCommande(id: bigint, dto: UpdateCommandeDto) {
    const commande = await this.prisma.commande.update({
      where: { IDCOMMANDES: id },
      data: toCommandeData(dto),
      select: commandeSelect,
    });
    return serializeBigInt(commande);
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
    ...dto,
    IDCONTRATS: dto.IDCONTRATS ? BigInt(dto.IDCONTRATS) : undefined,
    IDPRESTATIONS: dto.IDPRESTATIONS ? BigInt(dto.IDPRESTATIONS) : undefined,
  };
}
