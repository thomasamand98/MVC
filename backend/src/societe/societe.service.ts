// ===== MODEL (logique métier) =====
// Va chercher toutes les sociétés via Prisma. Appelé uniquement par
// SocieteController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateSocieteDto, UpdateSocieteDto } from './societe.dto.js';

export const societeSelect = {
  IDSOCIETES: true,
  Nom_societe: true,
  Denomination: true,
  TVA: true,
  Activite: true,
  Site_web: true,
} satisfies Prisma.SocieteSelect;

// Champs de facturation d'un Client/Fournisseur affichés dans les
// sous-onglets Client/Fournisseur de la fiche Société (SocieteForm.tsx) —
// mêmes champs des deux côtés, plus Iban/Bic propres au Fournisseur.
const clientBillingSelect = {
  IDCLIENTS: true,
  Numero_client: true,
  Delai_paiement: true,
  Taux_tva: true,
  E_mail_comptabilite: true,
  Facture_mail: true,
  Adresse_facturation_societe: true,
  IDADRESSES_facturation: true,
  IDCONTACTS_Comptabilite: true,
} satisfies Prisma.ClientSelect;

const fournisseurBillingSelect = {
  IDFOURNISSEURS: true,
  Numero_fournisseur: true,
  Delai_paiement: true,
  Taux_tva: true,
  E_mail_comptabilite: true,
  Facture_mail: true,
  Adresse_facturation_societe: true,
  IDADRESSES_facturation: true,
  IDCONTACTS_Comptabilite: true,
  Iban: true,
  Bic: true,
} satisfies Prisma.FournisseurSelect;

// Select complet pour GET /societes/:id — tous les champs scripturables de
// la société, plus l'adresse résolue (Adresse1/CP/Localite au lieu du seul
// IDADRESSES), les données de facturation Client/Fournisseur résolues
// (au lieu des seuls IDCLIENTS/IDFOURNISSEURS) et la totalité des contacts
// rattachés (table de jointure SocieteContacts).
export const societeDetailSelect = {
  ...societeSelect,
  Note: true,
  IDADRESSES: true,
  Prospect: true,
  Archive: true,
  Adresse: { select: { Adresse1: true, CP: true, Localite: true } },
  Client: { select: clientBillingSelect },
  Fournisseur: { select: fournisseurBillingSelect },
  SocieteContacts: {
    select: {
      Type_lien: true,
      Fonction_contact: true,
      Service_bureau: true,
      Contact: { select: { Nom_contact: true, Prenom_contact: true } },
    },
  },
} satisfies Prisma.SocieteSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const societeProjections: ProjectionMap<Prisma.SocieteWhereInput> = {
  contrats: (ids) => ({ Contrats: { some: { IDCONTRATS: { in: ids } } } }),
  contacts: (ids) => ({ SocieteContacts: { some: { IDCONTACTS: { in: ids } } } }),
  chauffeurs: (ids) => ({ Chauffeurs: { some: { IDCHAUFFEURS: { in: ids } } } }),
  vehicules: (ids) => ({ Vehicules: { some: { IDVEHICULES: { in: ids } } } }),
  points: (ids) => ({ Points: { some: { IDPOINTS: { in: ids } } } }),
};

@Injectable()
export class SocietesService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getSocietes(page?: number, pageSize?: number, search?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const filterWhere = buildSearchWhere<Prisma.SocieteWhereInput>(search, (c) => [
      { Nom_societe: c },
      { Denomination: c },
      { TVA: c },
      { Activite: c },
      { Site_web: c },
    ]);
    const where = andWhere<Prisma.SocieteWhereInput>(filterWhere, projectionWhere(societeProjections, projection));
    const [societes, total] = await Promise.all([
      this.prisma.societe.findMany({
        where,
        orderBy: { Nom_societe: 'asc' },
        select: societeSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.societe.count({ where }),
    ]);
    return { societes: serializeBigInt(societes), total };
  }

  async getSociete(id: bigint) {
    const societe = await this.prisma.societe.findUniqueOrThrow({
      where: { IDSOCIETES: id },
      select: societeDetailSelect,
    });
    return serializeBigInt(societe);
  }

  async createSociete(dto: CreateSocieteDto) {
    const data = toSocieteData(dto);
    const clientId = await this.upsertClient(null, dto);
    const fournisseurId = await this.upsertFournisseur(null, dto);
    const societe = await this.prisma.societe.create({
      // IDADRESSES/IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) quand ils sont
      // omis — mis explicitement à NULL.
      data: {
        ...data,
        IDADRESSES: data.IDADRESSES ?? null,
        IDCLIENTS: clientId,
        IDFOURNISSEURS: fournisseurId,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
      },
      select: societeSelect,
    });
    return serializeBigInt(societe);
  }

  async updateSociete(id: bigint, dto: UpdateSocieteDto) {
    const current = await this.prisma.societe.findUniqueOrThrow({
      where: { IDSOCIETES: id },
      select: { IDCLIENTS: true, IDFOURNISSEURS: true },
    });
    const clientId = await this.upsertClient(current.IDCLIENTS, dto);
    const fournisseurId = await this.upsertFournisseur(current.IDFOURNISSEURS, dto);
    const societe = await this.prisma.societe.update({
      where: { IDSOCIETES: id },
      data: { ...toSocieteData(dto), IDCLIENTS: clientId, IDFOURNISSEURS: fournisseurId },
      select: societeSelect,
    });
    return serializeBigInt(societe);
  }

  async deleteSociete(id: bigint) {
    await this.prisma.societe.delete({ where: { IDSOCIETES: id } });
  }

  // Crée le Client lié si aucun n'existe encore et que `Client_Numero_client`
  // est fourni (signal qu'il y a réellement une fiche client à créer),
  // sinon met à jour celui déjà lié avec les champs Client_* du DTO.
  // Retourne l'id à lier sur la société (inchangé si déjà lié, null si
  // aucun Client n'est/ne doit être lié).
  private async upsertClient(currentId: bigint | null, dto: CreateSocieteDto | UpdateSocieteDto): Promise<bigint | null> {
    if (currentId) {
      await this.prisma.client.update({ where: { IDCLIENTS: currentId }, data: clientDataFromDto(dto) });
      return currentId;
    }
    if (!dto.Client_Numero_client) return null;
    const created = await this.prisma.client.create({
      // IDUTILISATEURS_createur/modificateur ont un défaut DB de 0, qui
      // viole leur contrainte de clé étrangère (aucun utilisateur d'id 0)
      // — mis explicitement à NULL, même chose que createSociete plus haut.
      data: { ...clientDataFromDto(dto), IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
    });
    return created.IDCLIENTS;
  }

  // Même logique que upsertClient, pour le Fournisseur lié.
  private async upsertFournisseur(currentId: bigint | null, dto: CreateSocieteDto | UpdateSocieteDto): Promise<bigint | null> {
    if (currentId) {
      await this.prisma.fournisseur.update({ where: { IDFOURNISSEURS: currentId }, data: fournisseurDataFromDto(dto) });
      return currentId;
    }
    if (!dto.Fournisseur_Numero_fournisseur) return null;
    const created = await this.prisma.fournisseur.create({
      data: { ...fournisseurDataFromDto(dto), IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
    });
    return created.IDFOURNISSEURS;
  }
}

// Seuls les champs propres à Societe (pas les Client_*/Fournisseur_*, qui
// vivent sur d'autres tables — voir upsertClient/upsertFournisseur) ; un
// simple spread de `dto` enverrait ces clés à Prisma, qui les rejetterait
// (aucun champ de ce nom sur le modèle Societe).
function toSocieteData(dto: CreateSocieteDto | UpdateSocieteDto) {
  return {
    Nom_societe: dto.Nom_societe,
    Denomination: dto.Denomination,
    TVA: dto.TVA,
    Activite: dto.Activite,
    Site_web: dto.Site_web,
    Note: dto.Note,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
    Prospect: dto.Prospect,
    Archive: dto.Archive,
  };
}

function clientDataFromDto(dto: CreateSocieteDto | UpdateSocieteDto) {
  return {
    Numero_client: dto.Client_Numero_client,
    Delai_paiement: dto.Client_Delai_paiement,
    // Champ Decimal côté Prisma : une chaîne vide échoue au parsing (contrairement
    // à un VarChar, qui l'accepte) — convertie en `undefined` (valeur par défaut
    // DB à la création, champ inchangé à la mise à jour).
    Taux_tva: dto.Client_Taux_tva || undefined,
    E_mail_comptabilite: dto.Client_E_mail_comptabilite,
    Facture_mail: dto.Client_Facture_mail,
    Adresse_facturation_societe: dto.Client_Adresse_facturation_societe,
    IDADRESSES_facturation: dto.Client_IDADRESSES_facturation ? BigInt(dto.Client_IDADRESSES_facturation) : null,
    IDCONTACTS_Comptabilite: dto.Client_IDCONTACTS_Comptabilite ? BigInt(dto.Client_IDCONTACTS_Comptabilite) : null,
  };
}

function fournisseurDataFromDto(dto: CreateSocieteDto | UpdateSocieteDto) {
  return {
    Numero_fournisseur: dto.Fournisseur_Numero_fournisseur,
    Delai_paiement: dto.Fournisseur_Delai_paiement,
    // Voir clientDataFromDto ci-dessus pour l'explication du `|| undefined`.
    Taux_tva: dto.Fournisseur_Taux_tva || undefined,
    E_mail_comptabilite: dto.Fournisseur_E_mail_comptabilite,
    Facture_mail: dto.Fournisseur_Facture_mail,
    Adresse_facturation_societe: dto.Fournisseur_Adresse_facturation_societe,
    IDADRESSES_facturation: dto.Fournisseur_IDADRESSES_facturation ? BigInt(dto.Fournisseur_IDADRESSES_facturation) : null,
    IDCONTACTS_Comptabilite: dto.Fournisseur_IDCONTACTS_Comptabilite ? BigInt(dto.Fournisseur_IDCONTACTS_Comptabilite) : null,
    Iban: dto.Fournisseur_Iban,
    Bic: dto.Fournisseur_Bic,
  };
}
