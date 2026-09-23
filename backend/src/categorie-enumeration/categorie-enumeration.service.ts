// ===== MODEL (logique métier) =====
// Catégories d'énumérations (table categories_enumeration) : chacune regroupe
// une liste de valeurs (voir EnumerationService). Appelé uniquement par
// CategorieEnumerationController — jamais par la View directement.
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateCategorieEnumerationDto, UpdateCategorieEnumerationDto } from './categorie-enumeration.dto.js';

// `_count.Enumerations` évite au frontend un appel par catégorie pour
// afficher le nombre de valeurs dans la liste de gauche.
export const categorieEnumerationSelect = {
  IDCATEGORIES_ENUMERATION: true,
  Nom: true,
  Nom_affiche: true,
  Enum_system: true,
  _count: { select: { Enumerations: true } },
} satisfies Prisma.CategorieEnumerationSelect;

@Injectable()
export class CategorieEnumerationService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoriesEnumeration() {
    const categories = await this.prisma.categorieEnumeration.findMany({
      orderBy: { IDCATEGORIES_ENUMERATION: 'asc' },
      select: categorieEnumerationSelect,
    });
    return { categories: serializeBigInt(categories) };
  }

  async createCategorieEnumeration(dto: CreateCategorieEnumerationDto) {
    const categorie = await this.prisma.categorieEnumeration.create({
      // IDUTILISATEURS_createur a un défaut DB de 0, qui viole sa contrainte
      // de clé étrangère (aucun utilisateur d'id 0) quand il est omis — mis
      // explicitement à NULL (pas encore d'authentification pour le renseigner).
      data: { ...dto, IDUTILISATEURS_createur: null, Date_heure_creation: new Date(), Date_heure_modification: new Date() },
      select: categorieEnumerationSelect,
    });
    return serializeBigInt(categorie);
  }

  async updateCategorieEnumeration(id: bigint, dto: UpdateCategorieEnumerationDto) {
    const categorie = await this.prisma.categorieEnumeration.update({
      where: { IDCATEGORIES_ENUMERATION: id },
      data: { ...dto, Date_heure_modification: new Date() },
      select: categorieEnumerationSelect,
    });
    return serializeBigInt(categorie);
  }

  // Refuse de supprimer une catégorie système ou encore utilisée : les
  // énumérations qui y sont liées perdraient leur rattachement (clé
  // étrangère) et le code applicatif s'appuie sur les catégories système.
  async deleteCategorieEnumeration(id: bigint) {
    const categorie = await this.prisma.categorieEnumeration.findUniqueOrThrow({
      where: { IDCATEGORIES_ENUMERATION: id },
      select: categorieEnumerationSelect,
    });
    if (categorie.Enum_system) {
      throw new ConflictException('Une catégorie système ne peut pas être supprimée');
    }
    if (categorie._count.Enumerations > 0) {
      throw new ConflictException('Supprimez d’abord les énumérations de cette catégorie');
    }
    await this.prisma.categorieEnumeration.delete({ where: { IDCATEGORIES_ENUMERATION: id } });
  }
}
