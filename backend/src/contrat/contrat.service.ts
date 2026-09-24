// ===== MODEL (logique métier) =====
// Va chercher tous les contrats via Prisma. Appelé uniquement par
// ContratController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateContratDto, UpdateContratDto } from './contrat.dto.js';
import { conditionCmrSelect } from '../condition-cmr/condition-cmr.service.js';
import { EnumerationService } from '../enumeration/enumeration.service.js';
import { EntiteService } from '../entite/entite.service.js';
import type { MergeContext } from '../document-merge/merge-html.js';

// Partagé avec ContratEntity pour que le type reflète toujours exactement
// ce que la requête renvoie (voir contrat.entity.ts).
export const contratSelect = {
  IDCONTRATS: true,
  Num_contrat: true,
  Description_projet: true,
  Date_debut: true,
  Date_fin: true,
  IDSOCIETES: true,
  Societe: { select: { Nom_societe: true, TVA: true } },
} satisfies Prisma.ContratSelect;

// Select complet pour GET /contrats/:id — tous les champs scripturables du
// contrat, plus le type de facture et la marchandise résolus (au lieu des
// seuls IDTYPES_FACTURE/IDMARCHANDISES), le client de la société (numéro
// client affiché dans la fiche) et les listes liées des onglets de la fiche
// (conditions CMR, prestations, factures).
export const contratDetailSelect = {
  ...contratSelect,
  Societe: { select: { Nom_societe: true, TVA: true, Client: { select: { Numero_client: true, Taux_tva: true } } } },
  ConditionCmrs: { select: conditionCmrSelect, orderBy: { IDCONDITIONS_CMR: 'asc' } },
  Prestations: {
    select: {
      IDPRESTATIONS: true,
      Ordre: true,
      Description_prestation: true,
      Prix_unitaire: true,
      Unite: true,
      Marchandise: { select: { Nom_marchandise: true } },
    },
    orderBy: [{ Ordre: 'asc' }, { IDPRESTATIONS: 'asc' }],
  },
  Factures: {
    select: {
      IDFACTURES: true,
      num_Facture: true,
      Date_Facture: true,
      Date_echeance: true,
      Montant_Facture_HT: true,
      Taux_TVA: true,
      etat_Facture: true,
      Proformat: true,
      Note_de_Credit: true,
    },
    orderBy: [{ Date_Facture: 'desc' }, { IDFACTURES: 'desc' }],
  },
  IDTYPES_FACTURE: true,
  Annee_archivage: true,
  Offre_de_prix: true,
  Note_confidentielle: true,
  Instruction_CMR: true,
  Version_contrat: true,
  Archive: true,
  Reference_client: true,
  Taux_tva: true,
  Qt_client_facturation: true,
  Suivant: true,
  IDMARCHANDISES: true,
  Commissionnaire: true,
  Type_contrat: true,
  Marchandise: { select: { Nom_marchandise: true } },
  TypeFacture: { select: { Nom: true } },
} satisfies Prisma.ContratSelect;

// Select dédié à la fusion PDF (getContratMergeContext) : tous les champs
// couverts par frontend/src/features/documents/mergeFields.ts (groupe
// "Contrat"), qui ne recoupe qu'en partie contratDetailSelect ci-dessus
// (pensé pour la fiche, pas pour l'impression — ex. pas d'adresse société,
// pas d'Unite/Type/PrestationSupplementaires des prestations).
const contratMergeSelect = {
  Num_contrat: true,
  Version_contrat: true,
  Date_debut: true,
  Date_fin: true,
  Reference_client: true,
  Taux_tva: true,
  Instruction_CMR: true,
  Description_projet: true,
  Commissionnaire: true,
  TypeFacture: { select: { Nom: true } },
  Societe: {
    select: {
      Nom_societe: true,
      Denomination: true,
      TVA: true,
      Client: { select: { Numero_client: true, Delai_paiement: true } },
      Adresse: { select: { Adresse1: true, CP: true, Localite: true, Pays_full_name: true } },
    },
  },
  Prestations: {
    select: {
      Type: true,
      Description_prestation: true,
      Description_courte: true,
      Prix_unitaire: true,
      Unite: true,
      Instruction: true,
      Marchandise: { select: { Nom_marchandise: true } },
      PrestationSupplementaires: { select: { Description_prestation: true, Prix_unitaire: true, Unite: true } },
    },
    orderBy: [{ Ordre: 'asc' }, { IDPRESTATIONS: 'asc' }],
  },
} satisfies Prisma.ContratSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const contratProjections: ProjectionMap<Prisma.ContratWhereInput> = {
  societes: (ids) => ({ IDSOCIETES: { in: ids } }),
  commandes: (ids) => ({ Commandes: { some: { IDCOMMANDES: { in: ids } } } }),
};

@Injectable()
export class ContratService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enumerationService: EnumerationService,
    private readonly entiteService: EntiteService,
  ) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  // societeId optionnel : ne renvoie que les contrats de cette société —
  // alimente l'onglet « Contrats / Offres » de la fiche Société
  // (SocieteForm.tsx).
  async getContrats(page?: number, pageSize?: number, societeId?: string, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere: Prisma.ContratWhereInput = {
      ...(societeId ? { IDSOCIETES: BigInt(societeId) } : {}),
      ...buildSearchWhere<Prisma.ContratWhereInput>(search, (c) => [
        { Num_contrat: c },
        { Description_projet: c },
        { Societe: { Nom_societe: c } },
        { Societe: { TVA: c } },
      ]),
    };
    const where = andWhere<Prisma.ContratWhereInput>(filterWhere, projectionWhere(contratProjections, projection));
    const [contrats, total] = await Promise.all([
      this.prisma.contrat.findMany({
        where,
        orderBy: { IDCONTRATS: 'asc' },
        select: contratSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.contrat.count({ where }),
    ]);
    return { contrats: serializeBigInt(contrats), total };
  }

  // `Chiffre_affaires` (bloc « Chiffres clé » de la fiche) : somme HT des
  // factures du contrat, hors proformas (pas de vraies factures).
  async getContrat(id: bigint) {
    const [contrat, chiffreAffaires] = await Promise.all([
      this.prisma.contrat.findUniqueOrThrow({
        where: { IDCONTRATS: id },
        select: contratDetailSelect,
      }),
      this.prisma.facture.aggregate({
        _sum: { Montant_Facture_HT: true },
        where: { IDCONTRATS: id, OR: [{ Proformat: null }, { Proformat: { not: 1 } }] },
      }),
    ]);
    return serializeBigInt({ ...contrat, Chiffre_affaires: chiffreAffaires._sum.Montant_Facture_HT });
  }

  // Contexte de données pour la fusion PDF (voir DocumentMergeService,
  // appelé par ContratController.getContratPdf) : même forme, mêmes clés
  // racine (Entite/Contrat/Divers) que
  // frontend/src/features/documents/mergeFields.ts, pour que les chemins
  // posés par l'éditeur s'y résolvent directement. Pas de serializeBigInt
  // ici : ce contexte ne repart jamais tel quel en réponse HTTP (il est
  // uniquement consommé par resolveMergeHtml), les BigInt/Decimal/Date
  // Prisma bruts sont plus simples à formater que leur version sérialisée.
  //
  // Unite (Prestations/PrestationsSupplementaires) est un code numérique de
  // la catégorie d'énumération « unite_prestation » (voir
  // ContratPrestationsTab.tsx côté front) — résolu ici en libellé, pour ne
  // pas imprimer un code brut. Type n'a pas d'équivalent connu : imprimé tel
  // quel (déjà le cas dans le reste de l'app, qui ne l'affiche nulle part).
  async getContratMergeContext(id: bigint): Promise<MergeContext> {
    const [contrat, entite, { enumerations: unites }] = await Promise.all([
      this.prisma.contrat.findUniqueOrThrow({ where: { IDCONTRATS: id }, select: contratMergeSelect }),
      this.entiteService.getEntite(),
      this.enumerationService.getEnumerations(undefined, 'unite_prestation'),
    ]);

    const uniteLabels = new Map(unites.map((u) => [u.Valeur, u.Valeur_affiche]));
    const uniteLabel = (code: number | null) => (code === null ? null : (uniteLabels.get(String(code)) ?? String(code)));

    return {
      Entite: entite,
      Divers: { Date_edition: new Date(), CGV_URL: process.env.CGV_URL || null },
      Contrat: {
        ...contrat,
        Prestations: contrat.Prestations.map((prestation) => ({
          ...prestation,
          Unite: uniteLabel(prestation.Unite),
          PrestationSupplementaires: prestation.PrestationSupplementaires.map((supplement) => ({
            ...supplement,
            Unite: uniteLabel(supplement.Unite),
          })),
        })),
      },
    };
  }

  async createContrat(dto: CreateContratDto) {
    const data = toContratData(dto);
    const contrat = await this.prisma.contrat.create({
      // IDSOCIETES/IDTYPES_FACTURE/IDMARCHANDISES/IDUTILISATEURS_* ont un
      // défaut DB de 0, qui viole leur contrainte de clé étrangère (aucune
      // ligne d'id 0) quand ils sont omis — mis explicitement à NULL.
      data: {
        ...data,
        IDSOCIETES: data.IDSOCIETES ?? null,
        IDTYPES_FACTURE: data.IDTYPES_FACTURE ?? null,
        IDMARCHANDISES: data.IDMARCHANDISES ?? null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: contratSelect,
    });
    return serializeBigInt(contrat);
  }

  async updateContrat(id: bigint, dto: UpdateContratDto) {
    const contrat = await this.prisma.contrat.update({
      where: { IDCONTRATS: id },
      data: toContratData(dto),
      select: contratSelect,
    });
    return serializeBigInt(contrat);
  }

  async deleteContrat(id: bigint) {
    await this.prisma.contrat.delete({ where: { IDCONTRATS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seuls les champs dont le
// format JSON diffère (BigInt/Date) ont besoin d'être convertis, le reste
// passe tel quel via le spread. Taux_tva (Decimal côté Prisma) accepte
// directement une string non vide.
// Champ absent (undefined) = inchangé ; chaîne vide = effacé (NULL), pour que
// la fiche puisse vider une date de fin, une société, un type de facture...
function emptyToNull<T>(value: string | undefined, convert: (v: string) => T): T | null | undefined {
  if (value === undefined) return undefined;
  return value === '' ? null : convert(value);
}

function toContratData(dto: CreateContratDto | UpdateContratDto) {
  return {
    ...dto,
    Date_debut: emptyToNull(dto.Date_debut, (v) => new Date(v)),
    Date_fin: emptyToNull(dto.Date_fin, (v) => new Date(v)),
    IDSOCIETES: emptyToNull(dto.IDSOCIETES, BigInt),
    IDTYPES_FACTURE: emptyToNull(dto.IDTYPES_FACTURE, BigInt),
    IDMARCHANDISES: emptyToNull(dto.IDMARCHANDISES, BigInt),
    Taux_tva: emptyToNull(dto.Taux_tva, (v) => v),
  };
}
