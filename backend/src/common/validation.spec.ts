import { BadRequestException } from '@nestjs/common';
import { CreateChauffeurDto } from '../chauffeur/chauffeur.dto.js';
import { ContratTravailDto } from '../contrat-travail/contrat-travail.dto.js';
import { CreateDocumentTemplateDto } from '../document-template/document-template.dto.js';
import { MovePlanningExecutionDto } from '../planning/planning.dto.js';
import { CreateContratDto } from '../contrat/contrat.dto.js';
import { blankToNull } from './blank-to-null.js';
import { ZodBodyPipe } from './validation.js';

function messageOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).message;
  }
  throw new Error('aucune erreur levée');
}

describe('ZodBodyPipe', () => {
  const chauffeur = new ZodBodyPipe(CreateChauffeurDto);

  it('laisse passer un corps valide et retire les champs inconnus', () => {
    expect(chauffeur.transform({ Nom_chauffeur: 'Dupont', IDSOCIETES: '12', Archive: 0, Inconnu: 'x' })).toEqual({
      Nom_chauffeur: 'Dupont',
      IDSOCIETES: '12',
      Archive: 0,
    });
  });

  it('accepte les conversions tolérées (nombre ↔ texte, booléen → 0/1)', () => {
    expect(chauffeur.transform({ Telephone: 471000000, IDSOCIETES: 12, Archive: true })).toEqual({
      Telephone: '471000000',
      IDSOCIETES: '12',
      Archive: 1,
    });
    expect(chauffeur.transform({ Archive: '1' })).toEqual({ Archive: 1 });
  });

  it('traite un nombre vide comme non envoyé', () => {
    expect(chauffeur.transform({ Archive: '' })).toEqual({});
  });

  it('refuse un identifiant non numérique au lieu de faire planter BigInt', () => {
    expect(messageOf(() => chauffeur.transform({ IDSOCIETES: 'abc' }))).toBe('« IDSOCIETES » : identifiant invalide.');
  });

  it('refuse un mauvais type avec un message en français', () => {
    expect(messageOf(() => chauffeur.transform({ Nom_chauffeur: { x: 1 } }))).toBe('« Nom_chauffeur » : texte attendu.');
    expect(messageOf(() => chauffeur.transform({ Archive: 'oui' }))).toBe('« Archive » : nombre attendu.');
  });

  it('refuse un corps qui n’est pas un objet', () => {
    expect(messageOf(() => chauffeur.transform([1, 2]))).toBe('Corps de requête invalide.');
    expect(messageOf(() => chauffeur.transform(undefined))).toBe('Corps de requête invalide.');
  });

  it('signale les champs obligatoires et les valeurs hors liste', () => {
    const pipe = new ZodBodyPipe(CreateDocumentTemplateDto);
    expect(messageOf(() => pipe.transform({ Type_document: 'FACTURE', Contenu_html: '' }))).toBe(
      '« Nom » : champ obligatoire. « Type_document » : valeur non autorisée (CONTRAT).',
    );
  });

  it('valide les listes imbriquées et normalise les dates seules', () => {
    const pipe = new ZodBodyPipe(ContratTravailDto);
    expect(pipe.transform({ Date_debut: '2026-01-15', Taux: [{ Taux_horaire: '15,5', IDTAUX_HORAIRE: '3' }] })).toEqual({
      Date_debut: '2026-01-15T00:00:00.000Z',
      Taux: [{ Taux_horaire: '15,5', IDTAUX_HORAIRE: '3' }],
    });
    expect(pipe.transform({ Date_fin: '' })).toEqual({ Date_fin: '' });
    expect(messageOf(() => pipe.transform({ Taux: 'x' }))).toBe('« Taux » : liste attendue.');
    expect(messageOf(() => pipe.transform({ Taux: [{ IDTAUX_HORAIRE: '1;DROP' }] }))).toBe(
      '« Taux.0.IDTAUX_HORAIRE » : identifiant invalide.',
    );
    expect(messageOf(() => pipe.transform({ Date_debut: '2026-13-45' }))).toBe('« Date_debut » : date invalide.');
  });

  it('accepte null là où le DTO le prévoit (Planning)', () => {
    const pipe = new ZodBodyPipe(MovePlanningExecutionDto);
    expect(pipe.transform({ start: 'a', end: 'b', chauffeurId: null })).toEqual({ start: 'a', end: 'b', chauffeurId: null });
  });
});

describe('decimal', () => {
  const pipe = new ZodBodyPipe(CreateContratDto);

  it('normalise la virgule et accepte le vide', () => {
    expect(pipe.transform({ Taux_tva: '21,5' })).toEqual({ Taux_tva: '21.5' });
    expect(pipe.transform({ Taux_tva: 6 })).toEqual({ Taux_tva: '6' });
    expect(pipe.transform({ Taux_tva: '' })).toEqual({ Taux_tva: '' });
  });

  it('refuse un texte non numérique au lieu d’une erreur Prisma', () => {
    expect(messageOf(() => pipe.transform({ Taux_tva: 'vingt' }))).toBe('« Taux_tva » : nombre décimal attendu.');
  });
});

describe('blankToNull', () => {
  it('vide seulement les champs indiqués', () => {
    expect(blankToNull({ Date_vente: '', Marque: '', Date_debut: '2026-01-01' }, ['Date_vente', 'Date_debut'])).toEqual({
      Date_vente: null,
      Marque: '',
      Date_debut: '2026-01-01',
    });
  });
});
