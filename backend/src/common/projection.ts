// Projection (bouton « Projection » des tableaux, voir
// frontend/src/components/projection/) : liste les enregistrements d'une
// table liés aux lignes sélectionnées dans une autre, via ?via=<table
// source>&ids=1,2,3 — ex. GET /contrats?via=societes&ids=12,15 renvoie les
// contrats des sociétés 12 et 15. Chaque service déclare, par table
// source, comment filtrer ses propres lignes (ProjectionMap).
import { BadRequestException } from '@nestjs/common';

export type Projection = { via: string; ids: bigint[] };

export type ProjectionMap<TWhere> = Record<string, (ids: bigint[]) => TWhere>;

// Lit ?via=&ids= (voir les *.controller.ts) — undefined sans ?via.
export function parseProjection(via?: string, ids?: string): Projection | undefined {
  if (!via) return undefined;
  const list = (ids ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!list.every((id) => /^\d+$/.test(id))) throw new BadRequestException('Paramètre ids invalide');
  return { via, ids: list.map((id) => BigInt(id)) };
}

export function projectionWhere<TWhere>(map: ProjectionMap<TWhere>, projection: Projection | undefined): TWhere | undefined {
  if (!projection) return undefined;
  const build = map[projection.via];
  if (!build) throw new BadRequestException(`Projection depuis « ${projection.via} » non disponible`);
  return build(projection.ids);
}

// Combine plusieurs conditions (recherche, projection...) en ignorant
// celles qui sont absentes.
export function andWhere<TWhere>(...parts: (TWhere | undefined)[]): { AND: TWhere[] } {
  return { AND: parts.filter((part): part is TWhere => part !== undefined) };
}
