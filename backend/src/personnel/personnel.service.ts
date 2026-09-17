// ===== MODEL (logique métier) =====
// Va chercher tous les personnels via Prisma. Appelé uniquement par
// PersonnelController — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';
import { CreatePersonnelDto, UpdatePersonnelDto } from './personnel.dto.js';

export const personnelSelect = {
  IDPERSONNELS: true,
  Civilite_Personnel: true,
  Prenom_Personnel: true,
  Nom_Personnel: true,
  Telephone_professionnel: true,
  Telephone_fixe: true,
  Date_validite_CAP: true,
  Date_validite_selection_medicale: true,
  Date_validite_carte_chauffeur: true,
  Num_service_social: true,
} satisfies Prisma.PersonnelSelect;

// Select complet pour GET /personnel/:id — ajoute les champs scripturables
// absents de personnelSelect (celui-ci contient déjà toutes les colonnes du
// tableau). IDADRESSES n'est pas résolu (pas de relation Prisma vers
// Adresse sur ce modèle, contrairement à Contact/Societe/Point).
export const personnelDetailSelect = {
  ...personnelSelect,
  Telephone_portable: true,
  Telephone_autre: true,
  Description_telephone: true,
  E_mail: true,
  E_mail_professionnel: true,
  Num_registre_national: true,
  Date_naissance: true,
  Lieu_naissance: true,
  Pays_Naissance: true,
  Etat_civil: true,
  Nbr_personne_charge: true,
  Iban: true,
  Bic: true,
  Nom_Banque: true,
  Qualification: true,
  Routier: true,
  Manutention: true,
  Atelier: true,
  Commentaire_Personnel: true,
  IDADRESSES: true,
  Date_validite_carte_identite: true,
  Date_validite_A1: true,
  Date_validite_SIPSI: true,
} satisfies Prisma.PersonnelSelect;

@Injectable()
export class PersonnelService {
  constructor(private readonly prisma: PrismaService) {}

  // page/pageSize optionnels : omis, le comportement est inchangé (toute la
  // table). Fournis, la requête est découpée avec skip/take et `total`
  // (nombre total de lignes, pas juste celles de la page) est renvoyé à
  // côté pour que le frontend puisse calculer le nombre de pages.
  async getPersonnels(page?: number, pageSize?: number) {
    const paginate = page !== undefined && pageSize !== undefined && pageSize > 0;
    const [personnels, total] = await Promise.all([
      this.prisma.personnel.findMany({
        orderBy: { IDPERSONNELS: 'asc' },
        select: personnelSelect,
        ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      this.prisma.personnel.count(),
    ]);
    return { personnel: serializeBigInt(personnels), total };
  }

  async getPersonnel(id: bigint) {
    const personnel = await this.prisma.personnel.findUniqueOrThrow({
      where: { IDPERSONNELS: id },
      select: personnelDetailSelect,
    });
    return serializeBigInt(personnel);
  }

  async createPersonnel(dto: CreatePersonnelDto) {
    const data = toPersonnelData(dto);
    const personnel = await this.prisma.personnel.create({
      // IDADRESSES/IDUTILISATEURS_* ont un défaut DB de 0, qui viole leur
      // contrainte de clé étrangère (aucune ligne d'id 0) quand ils sont
      // omis — mis explicitement à NULL.
      data: { ...data, IDADRESSES: data.IDADRESSES ?? null, IDUTILISATEURS_createur: null, IDUTILISATEURS_modificateur: null },
      select: personnelSelect,
    });
    return serializeBigInt(personnel);
  }

  async updatePersonnel(id: bigint, dto: UpdatePersonnelDto) {
    const personnel = await this.prisma.personnel.update({
      where: { IDPERSONNELS: id },
      data: toPersonnelData(dto),
      select: personnelSelect,
    });
    return serializeBigInt(personnel);
  }

  async deletePersonnel(id: bigint) {
    await this.prisma.personnel.delete({ where: { IDPERSONNELS: id } });
  }
}

// Le DTO a les mêmes noms de champs que Prisma — seul IDADRESSES (BigInt
// côté Prisma, string côté JSON) a besoin d'être converti, le reste passe
// tel quel via le spread (les Date_* acceptent directement une string ISO).
function toPersonnelData(dto: CreatePersonnelDto | UpdatePersonnelDto) {
  return {
    ...dto,
    IDADRESSES: dto.IDADRESSES ? BigInt(dto.IDADRESSES) : undefined,
  };
}
