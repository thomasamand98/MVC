// ===== MODEL (logique métier) =====
// Contrairement aux autres features sous src/, `entites` ne contient
// qu'une seule ligne (les coordonnées de la société courante) — pas de
// liste, pas de création/suppression, uniquement lecture et modification
// de cet unique enregistrement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { UpdateEntiteDto } from './entite.dto.js';

export const entiteSelect = {
  IDSignaletique: true,
  Nom_societe: true,
  Nom_court: true,
  Num_Telephone: true,
  Email_contact: true,
  Num_TVA: true,
  Nom_Banque: true,
  Iban: true,
  Bic: true,
  Signataire: true,
  numero_ucm: true,
  Num_licence: true,
  Valeur_facial_cheque_repas: true,
  Seveur_SMTP: true,
  Port_SMTP: true,
  Utilisateur_SMTP: true,
  MDP_SMTP: true,
  TypeConnexion_SMTP: true,
  Utilisateur_smtp_planning: true,
  MDP_SMTP_Planning: true,
  IDADRESSES: true,
} satisfies Prisma.EntiteSelect;

const addressSelect = {
  Adresse1: true,
  Adresse2: true,
  Adresse3: true,
  CP: true,
  Localite: true,
  Pays: true,
  Pays_full_name: true,
} satisfies Prisma.AdresseSelect;

const addressFieldNames = ['Adresse1', 'Adresse2', 'Adresse3', 'CP', 'Localite', 'Pays', 'Pays_full_name'] as const;

@Injectable()
export class EntiteService {
  constructor(private readonly prisma: PrismaService) {}

  // Pas de relation Prisma déclarée entre Entite et Adresse (contrairement
  // à Societe/Point) — l'adresse est rechargée séparément via IDADRESSES.
  async getEntite() {
    const entite = await this.prisma.entite.findFirstOrThrow({ select: entiteSelect });
    const adresse = entite.IDADRESSES
      ? await this.prisma.adresse.findUnique({ where: { IDADRESSES: entite.IDADRESSES }, select: addressSelect })
      : null;
    return serializeBigInt({ ...entite, Adresse: adresse });
  }

  // Sépare les champs d'adresse (aplatis côté DTO) du reste, et les
  // persiste dans la table `adresses` liée via IDADRESSES — créée si
  // l'entité n'en a pas encore (cas normalement jamais rencontré en
  // pratique, la ligne existante en a toujours une).
  async updateEntite(dto: UpdateEntiteDto) {
    const current = await this.prisma.entite.findFirstOrThrow();

    const addressData: Partial<Record<(typeof addressFieldNames)[number], string>> = {};
    for (const field of addressFieldNames) {
      if (dto[field] !== undefined) addressData[field] = dto[field];
    }
    const entiteFields = { ...dto };
    for (const field of addressFieldNames) delete entiteFields[field];

    let idAdresses = current.IDADRESSES;
    if (Object.keys(addressData).length > 0) {
      if (idAdresses) {
        await this.prisma.adresse.update({ where: { IDADRESSES: idAdresses }, data: addressData });
      } else {
        const created = await this.prisma.adresse.create({ data: addressData });
        idAdresses = created.IDADRESSES;
      }
    }

    await this.prisma.entite.update({
      where: { IDSignaletique: current.IDSignaletique },
      data: { ...entiteFields, IDADRESSES: idAdresses !== current.IDADRESSES ? idAdresses : undefined },
    });

    return this.getEntite();
  }
}
