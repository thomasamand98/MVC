// ===== MODEL (logique métier) =====
// Va chercher tous les contacts via Prisma. Appelé uniquement par
// ContactController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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
  // société/fonction/service du tableau.
  SocieteContacts: {
    take: 1,
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
  SocieteContacts: {
    select: {
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

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getContacts(page?: number, pageSize?: number) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        orderBy: { IDCONTACTS: 'asc' },
        select: contactSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.contact.count(),
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

  async createContact(dto: CreateContactDto) {
    const data = toContactData(dto);
    const contact = await this.prisma.contact.create({
      // IDADRESSES/IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) quand ils sont
      // omis — mis explicitement à NULL.
      data: { ...data, IDADRESSES: data.IDADRESSES ?? null, IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
      select: contactSelect,
    });
    return serializeBigInt(contact);
  }

  async updateContact(id: bigint, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.update({
      where: { IDCONTACTS: id },
      data: toContactData(dto),
      select: contactSelect,
    });
    return serializeBigInt(contact);
  }

  async deleteContact(id: bigint) {
    await this.prisma.contact.delete({ where: { IDCONTACTS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seul IDADRESSES (BigInt
// côté Prisma, string côté JSON) a besoin d'être converti, le reste passe
// tel quel via le spread.
function toContactData(dto: CreateContactDto | UpdateContactDto) {
  return {
    ...dto,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
  };
}
