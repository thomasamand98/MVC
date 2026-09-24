// ===== MODEL (logique métier) =====
// Va chercher tous les contacts via Prisma. Appelé uniquement par
// ContactController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildSearchWhere } from '../common/search.js';
import { andWhere, projectionWhere, type Projection, type ProjectionMap } from '../common/projection.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreateContactDto, UpdateContactDto } from './contact.dto.js';

export const contactSelect = {
  IDCONTACTS: true,
  Civilite: true,
  Nom_contact: true,
  Prenom_contact: true,
  Telephone_portable: true,
  Telephone_fixe: true,
  E_mail: true,
  // Un contact peut être lié à plusieurs sociétés (table de jointure
  // SocieteContacts) — on ne garde que la première pour les colonnes
  // société/fonction/service du tableau (le plus ancien lien, le même que la
  // « société principale » de la fiche, voir updateContact).
  SocieteContacts: {
    take: 1,
    orderBy: { IDSOCIETES_CONTACTS: 'asc' },
    select: {
      Fonction_contact: true,
      Service_bureau: true,
      Societe: { select: { Nom_societe: true } },
    },
  },
} satisfies Prisma.ContactSelect;

// Select complet pour GET /contacts/:id — tous les champs scripturables du
// contact, plus la totalité de ses rattachements société/point (contrairement
// à contactSelect, utilisé par la liste, qui n'en garde qu'un seul).
export const contactDetailSelect = {
  ...contactSelect,
  Telephone_autre: true,
  Remarque: true,
  Personne_physique: true,
  Adresse_entreprise: true,
  description_telephone: true,
  IDADRESSES: true,
  Adresse: { select: { Adresse1: true, CP: true, Localite: true } },
  // Le premier lien est la « société principale » modifiable dans la fiche
  // (voir updateContact) — IDSOCIETES sert à présélectionner la liste.
  SocieteContacts: {
    orderBy: { IDSOCIETES_CONTACTS: 'asc' },
    select: {
      IDSOCIETES: true,
      Type_lien: true,
      Fonction_contact: true,
      Service_bureau: true,
      Societe: { select: { Nom_societe: true } },
    },
  },
  PointContacts: {
    select: {
      Lien: true,
      Recevoir_Mail_Planning: true,
      Point: { select: { Libelle: true } },
    },
  },
} satisfies Prisma.ContactSelect;

// Projection (voir common/projection.ts) : pour chaque table source, les
// lignes de cette table liées aux ids sélectionnés.
const contactProjections: ProjectionMap<Prisma.ContactWhereInput> = {
  societes: (ids) => ({ SocieteContacts: { some: { IDSOCIETES: { in: ids } } } }),
  points: (ids) => ({ PointContacts: { some: { IDPOINTS: { in: ids } } } }),
};

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  // societeId optionnel : ne renvoie que les contacts liés à cette société
  // (onglet Contacts de la fiche Société, SocieteContactsTab.tsx) — les
  // colonnes Fonction/Service affichent alors le lien avec CETTE société
  // plutôt que le premier lien trouvé.
  async getContacts(page?: number, pageSize?: number, search?: string, societeId?: string, projection?: Projection) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const societeFilter = societeId ? { IDSOCIETES: BigInt(societeId) } : undefined;
    const select = societeFilter
      ? { ...contactSelect, SocieteContacts: { ...contactSelect.SocieteContacts, where: societeFilter } }
      : contactSelect;
    const filterWhere: Prisma.ContactWhereInput = {
      ...(societeFilter ? { SocieteContacts: { some: societeFilter } } : {}),
      ...buildSearchWhere<Prisma.ContactWhereInput>(search, (c) => [
      { Civilite: c },
      { Nom_contact: c },
      { Prenom_contact: c },
      { Telephone_portable: c },
      { Telephone_fixe: c },
      { E_mail: c },
      { SocieteContacts: { some: { Fonction_contact: c } } },
      { SocieteContacts: { some: { Service_bureau: c } } },
      { SocieteContacts: { some: { Societe: { Nom_societe: c } } } },
      ]),
    };
    const where = andWhere<Prisma.ContactWhereInput>(filterWhere, projectionWhere(contactProjections, projection));
    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { IDCONTACTS: 'asc' },
        select,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.contact.count({ where }),
    ]);
    return { contacts: serializeBigInt(contacts), total };
  }

  async getContact(id: bigint) {
    const contact = await this.prisma.contact.findUniqueOrThrow({
      where: { IDCONTACTS: id },
      select: contactDetailSelect,
    });
    return serializeBigInt(contact);
  }

  // dto.IDSOCIETES (création depuis la fiche Société) : le contact est
  // créé directement lié à cette société, dans la même requête.
  async createContact(dto: CreateContactDto) {
    const data = toContactData(dto);
    const contact = await this.prisma.contact.create({
      // IDADRESSES/IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) quand ils sont
      // omis — mis explicitement à NULL.
      data: {
        ...data,
        IDADRESSES: data.IDADRESSES ?? null,
        IDUTILISATEURS_createur: null,
        IDUTILISATEURS_modificateur: null,
        ...(dto.IDSOCIETES
          ? {
              SocieteContacts: {
                create: {
                  IDSOCIETES: BigInt(dto.IDSOCIETES),
                  Fonction_contact: dto.Fonction_contact || null,
                  Service_bureau: dto.Service_bureau || null,
                  IDUTILISATEURS_createur: null,
                  IDUTILISATEURS_modificateur: null,
                },
              },
            }
          : {}),
      },
      select: contactSelect,
    });
    return serializeBigInt(contact);
  }

  // dto.IDSOCIETES présent : met à jour la « société principale » du
  // contact (son plus ancien lien SocieteContact) — créée si le contact n'en
  // a pas, supprimée si la valeur est vide. Les autres liens sont inchangés.
  async updateContact(id: bigint, dto: UpdateContactDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.IDSOCIETES !== undefined) {
        const principal = await tx.societeContact.findFirst({
          where: { IDCONTACTS: id },
          orderBy: { IDSOCIETES_CONTACTS: 'asc' },
          select: { IDSOCIETES_CONTACTS: true },
        });
        const link = {
          IDSOCIETES: dto.IDSOCIETES ? BigInt(dto.IDSOCIETES) : null,
          Fonction_contact: dto.Fonction_contact || null,
          Service_bureau: dto.Service_bureau || null,
        };
        if (!dto.IDSOCIETES) {
          if (principal) await tx.societeContact.delete({ where: { IDSOCIETES_CONTACTS: principal.IDSOCIETES_CONTACTS } });
        } else if (principal) {
          await tx.societeContact.update({ where: { IDSOCIETES_CONTACTS: principal.IDSOCIETES_CONTACTS }, data: link });
        } else {
          await tx.societeContact.create({
            data: { ...link, IDCONTACTS: id, IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
          });
        }
      }
      const contact = await tx.contact.update({
        where: { IDCONTACTS: id },
        data: toContactData(dto),
        select: contactSelect,
      });
      return serializeBigInt(contact);
    });
  }

  async deleteContact(id: bigint) {
    await this.prisma.contact.delete({ where: { IDCONTACTS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seul IDADRESSES (BigInt
// côté Prisma, string côté JSON) a besoin d'être converti, le reste passe
// tel quel via le spread.
// IDSOCIETES/Fonction_contact/Service_bureau appartiennent au lien
// SocieteContact (voir createContact), pas au contact lui-même.
function toContactData(dto: CreateContactDto | UpdateContactDto) {
  const { IDSOCIETES: _societe, Fonction_contact: _fonction, Service_bureau: _service, ...contact } = dto;
  return {
    ...contact,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
  };
}
