import { BadRequestException } from '@nestjs/common';
import { MAX_PAGE_SIZE, OptionalIdPipe, ParseIdPipe, parsePage, parsePageSize } from './params.js';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it('convertit un identifiant numérique en bigint', () => {
    expect(pipe.transform('9007199254740993')).toBe(9007199254740993n);
  });

  it.each(['abc', '12a', '-1', '1.5', '', undefined as unknown as string])('refuse %j en 400', (raw) => {
    expect(() => pipe.transform(raw)).toThrow(BadRequestException);
  });
});

describe('OptionalIdPipe', () => {
  const pipe = new OptionalIdPipe();

  it('renvoie undefined quand le paramètre est absent ou vide', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform('')).toBeUndefined();
  });

  it('valide sinon comme ParseIdPipe', () => {
    expect(pipe.transform('42')).toBe(42n);
    expect(() => pipe.transform('x')).toThrow(BadRequestException);
  });
});

describe('pagination', () => {
  it('laisse la pagination désactivée quand elle est absente', () => {
    expect(parsePage(undefined)).toBeUndefined();
    expect(parsePageSize(undefined)).toBeUndefined();
  });

  it('garde pageSize=0 (« Tous ») et plafonne les grandes tailles', () => {
    expect(parsePageSize('0')).toBe(0);
    expect(parsePageSize('25')).toBe(25);
    expect(parsePageSize('10000000')).toBe(MAX_PAGE_SIZE);
  });

  it.each(['abc', '0', '-2', '1.5'])('refuse page=%s', (raw) => {
    expect(() => parsePage(raw)).toThrow(BadRequestException);
  });

  it.each(['abc', '-1', '2.5'])('refuse pageSize=%s', (raw) => {
    expect(() => parsePageSize(raw)).toThrow(BadRequestException);
  });
});
