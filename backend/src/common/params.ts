// Lecture des paramètres d'URL et de query string. Un identifiant ou une
// pagination mal formés sont refusés en 400, au lieu de faire planter
// BigInt()/Prisma plus loin (500).
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Taille de page maximale acceptée. 0 reste permis : c'est l'option « Tous »
// du sélecteur de pagination (voir frontend/src/components/CrudPage.tsx).
export const MAX_PAGE_SIZE = 500;

function toId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new BadRequestException('Identifiant invalide.');
  return BigInt(raw);
}

// @Param('id', ParseIdPipe) id: bigint
@Injectable()
export class ParseIdPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    return toId(value ?? '');
  }
}

// @Query('societeId', OptionalIdPipe) societeId?: bigint — absent ou vide :
// undefined.
@Injectable()
export class OptionalIdPipe implements PipeTransform<string | undefined, bigint | undefined> {
  transform(value: string | undefined): bigint | undefined {
    return value ? toId(value) : undefined;
  }
}

// ?page= : entier ≥ 1, absent = pas de pagination.
export function parsePage(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1) throw new BadRequestException('Numéro de page invalide.');
  return page;
}

// ?pageSize= : entier ≥ 0 (0 = tout), plafonné à MAX_PAGE_SIZE.
export function parsePageSize(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const pageSize = Number(raw);
  if (!Number.isInteger(pageSize) || pageSize < 0) throw new BadRequestException('Taille de page invalide.');
  return Math.min(pageSize, MAX_PAGE_SIZE);
}

// ?archive= : filtre sur la colonne Archive (code 0/1 WinDev). « 1 » =
// archivés, « 0 » = non archivés (NULL compris), absent ou vide = tous.
export function parseArchive(raw: string | undefined): { OR: { Archive: number | null }[] } | { Archive: number } | undefined {
  if (!raw) return undefined;
  if (raw === '1') return { Archive: 1 };
  if (raw === '0') return { OR: [{ Archive: 0 }, { Archive: null }] };
  throw new BadRequestException('Filtre « archive » invalide (0 ou 1 attendu).');
}

// Jour « AAAA-MM-JJ » → minuit UTC, comme Prisma représente une colonne DATE.
export function parseDay(raw: string | undefined, field: string): Date {
  const date = new Date(`${raw ?? ''}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw ?? '') || Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Date invalide pour « ${field} ».`);
  }
  return date;
}

// ?from=&to= (jours « AAAA-MM-JJ », bornes incluses) : filtre d'une liste
// sur une colonne DATE. Absents = pas de filtre ; un seul = borne ouverte.
export function parsePeriod(fromRaw: string | undefined, toRaw: string | undefined): { gte?: Date; lte?: Date } | undefined {
  if (!fromRaw && !toRaw) return undefined;
  const from = fromRaw ? parseDay(fromRaw, 'from') : undefined;
  const to = toRaw ? parseDay(toRaw, 'to') : undefined;
  if (from && to && to < from) throw new BadRequestException('La fin de la période doit être après son début.');
  return { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
}
