import type { Prisma } from '../generated/prisma/client.js';
import type { contratSelect } from './contrat.service.js';

type ContratData = Prisma.ContratGetPayload<{ select: typeof contratSelect }>;

export class ContratEntity {
  constructor(private readonly data: ContratData) {}

  get numero() { return this.data.Num_contrat; }
  get societe() { return this.data.Societe?.Nom_societe; }
  get numeroTVA() { return this.data.Societe?.TVA; }
  get description() { return this.data.Description_projet; }
  get dateDebut() { return this.data.Date_debut; }
  get dateFin() { return this.data.Date_fin; }

  estActif(): boolean {
    if (this.data.Date_fin) {
      return this.data.Date_fin > new Date();
    } else {
      return true;
    }
  }
}