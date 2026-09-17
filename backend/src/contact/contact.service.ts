// ===== MODEL (logique métier) =====
// Va chercher tous les contacts via Prisma. Appelé uniquement par
// ContactController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async getContacts() {
    const contacts = await this.prisma.contact.findMany({
      orderBy: { IDCONTACTS: 'asc' },
      select: contactSelect,
    });
    // IDCONTACTS est un BigInt (JSON.stringify ne sait pas le sérialiser) →
    // converti en string pour que la réponse HTTP reste valide.
    return contacts.map((contact) => ({ ...contact, IDCONTACTS: contact.IDCONTACTS.toString() }));
  }

  async createContact(dto: CreateContactDto) {
    const contact = await this.prisma.contact.create({
      // IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur contrainte de
      // clé étrangère (aucune ligne d'id 0) — mis explicitement à NULL.
      data: { ...dto, IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
      select: contactSelect,
    });
    return { ...contact, IDCONTACTS: contact.IDCONTACTS.toString() };
  }

  async updateContact(id: bigint, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.update({
      where: { IDCONTACTS: id },
      data: dto,
      select: contactSelect,
    });
    return { ...contact, IDCONTACTS: contact.IDCONTACTS.toString() };
  }

  async deleteContact(id: bigint) {
    await this.prisma.contact.delete({ where: { IDCONTACTS: id } });
  }
}
