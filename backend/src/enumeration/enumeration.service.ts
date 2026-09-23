// ===== MODEL (logique métier) =====
// Valeurs d'énumération (table enumerations), chacune rattachée à une
// catégorie (voir CategorieEnumerationService). Appelé uniquement par
// EnumerationController — jamais par la View directement.
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateEnumerationDto, UpdateEnumerationDto } from './enumeration.dto.js';

export const enumerationSelect = {
  IDENUMERATIONS: true,
  IDCATEGORIES_ENUMERATION: true,
  Valeur_affiche: true,
  Valeur: true,
  Ordre: true,
  Valeur_associee: true,
  Valeur_system: true,
} satisfies Prisma.EnumerationSelect;

@Injectable()
export class EnumerationService {
  constructor(private readonly prisma: PrismaService) {}

  // `categorieId` optionnel : fourni, ne renvoie que les valeurs de cette
  // catégorie (cas de l'écran Configuration > Enumérations) ; omis, toute la
  // table. `categorieNom` (ex. « unite_prestation ») fait de même en
  // désignant la catégorie par son nom technique, pour les écrans qui ne
  // connaissent pas son id (ex. libellés des unités dans la fiche contrat).
  // Triées par Ordre puis libellé, comme elles s'affichent dans les listes
  // déroulantes de l'application.
  async getEnumerations(categorieId?: bigint, categorieNom?: string) {
    const enumerations = await this.prisma.enumeration.findMany({
      where: {
        ...(categorieId !== undefined ? { IDCATEGORIES_ENUMERATION: categorieId } : {}),
        ...(categorieNom ? { CategorieEnumeration: { Nom: categorieNom } } : {}),
      },
      orderBy: [{ Ordre: 'asc' }, { Valeur_affiche: 'asc' }, { IDENUMERATIONS: 'asc' }],
      select: enumerationSelect,
    });
    return { enumerations: serializeBigInt(enumerations) };
  }

  async createEnumeration(dto: CreateEnumerationDto) {
    const enumeration = await this.prisma.enumeration.create({
      // IDUTILISATEURS_createur/modificateur ont un défaut DB de 0, qui viole
      // leur contrainte de clé étrangère (aucun utilisateur d'id 0) quand ils
      // sont omis — mis explicitement à NULL (pas encore d'authentification
      // pour les renseigner).
      data: {
        ...toEnumerationData(dto),
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
        Date_heure_creation: new Date(),
        Date_heure_modification: new Date(),
      },
      select: enumerationSelect,
    });
    return serializeBigInt(enumeration);
  }

  async updateEnumeration(id: bigint, dto: UpdateEnumerationDto) {
    const enumeration = await this.prisma.enumeration.update({
      where: { IDENUMERATIONS: id },
      data: { ...toEnumerationData(dto), Date_heure_modification: new Date() },
      select: enumerationSelect,
    });
    return serializeBigInt(enumeration);
  }

  async deleteEnumeration(id: bigint) {
    const enumeration = await this.prisma.enumeration.findUniqueOrThrow({
      where: { IDENUMERATIONS: id },
      select: { Valeur_system: true },
    });
    if (enumeration.Valeur_system) {
      throw new ConflictException('Une valeur système ne peut pas être supprimée');
    }
    await this.prisma.enumeration.delete({ where: { IDENUMERATIONS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seul l'id de catégorie
// (BigInt côté Prisma, string côté JSON) a besoin d'être converti.
function toEnumerationData(dto: CreateEnumerationDto | UpdateEnumerationDto) {
  return {
    ...dto,
    IDCATEGORIES_ENUMERATION: dto.IDCATEGORIES_ENUMERATION ? BigInt(dto.IDCATEGORIES_ENUMERATION) : undefined,
  };
}
