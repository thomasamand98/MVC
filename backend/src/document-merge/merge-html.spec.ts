import { describe, expect, it } from 'vitest';
import { resolveMergeHtml } from './merge-html.js';

const chip = (path: string, kind?: string) =>
  `<span data-merge-field="${path}"${kind ? ` data-kind="${kind}"` : ''} contenteditable="false">${path}<button data-chip-remove>x</button></span>`;

// Decimal Prisma : un objet avec toNumber()/toString().
const decimal = (value: number) => ({ toNumber: () => value, toString: () => String(value) });

describe('resolveMergeHtml', () => {
  it('remplace les jetons par leur valeur formatée et retire le chrome de l’éditeur', () => {
    const html = resolveMergeHtml(`<p>${chip('Contrat.Num_contrat')} du ${chip('Contrat.Date', 'date')} : ${chip('Contrat.Total', 'number')}</p>`, {
      Contrat: { Num_contrat: 'C-42', Date: new Date('2026-09-25T00:00:00Z'), Total: decimal(1234.5) },
    });
    expect(html).toContain('C-42');
    expect(html).toContain(new Date('2026-09-25T00:00:00Z').toLocaleDateString('fr-BE'));
    expect(html).toContain((1234.5).toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    expect(html).not.toContain('data-merge-field');
    expect(html).not.toContain('contenteditable');
    expect(html).not.toContain('<button');
  });

  it('échappe le texte des valeurs', () => {
    const html = resolveMergeHtml(`<p>${chip('Societe.Nom')}</p>`, { Societe: { Nom: '<script>alert(1)</script>' } });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('n’écrit jamais « [object Object] » pour un chemin qui pointe vers un objet', () => {
    const html = resolveMergeHtml(`<p>${chip('Contrat.Societe')}|${chip('Contrat.Absent')}|${chip('Contrat.Societe', 'number')}</p>`, {
      Contrat: { Societe: { Nom: 'ACME' } },
    });
    expect(html).not.toContain('[object Object]');
    expect(html).toContain('<p><span class="dte-merged"></span>|<span class="dte-merged"></span>|<span class="dte-merged"></span></p>');
  });

  it('développe un bloc répétable une fois par élément', () => {
    const template = `<table data-repeat-list="Contrat.Prestations[]"><tbody><tr class="dte-repeat-row"><td>${chip('Contrat.Prestations[].Nom')}</td></tr></tbody></table>`;
    const html = resolveMergeHtml(template, { Contrat: { Prestations: [{ Nom: 'Transport' }, { Nom: 'Attente' }] } });
    expect(html.match(/dte-repeat-row/g)).toHaveLength(2);
    expect(html.indexOf('Transport')).toBeLessThan(html.indexOf('Attente'));
    expect(html).not.toContain('data-repeat-list');
  });

  it('remplace un jeton image par une <img>, ou le retire sans valeur', () => {
    expect(resolveMergeHtml(chip('Entite.Logo', 'image'), { Entite: { Logo: 'data:image/png;base64,AAAA' } })).toBe(
      '<img class="dte-merged-image" src="data:image/png;base64,AAAA">',
    );
    expect(resolveMergeHtml(chip('Entite.Logo', 'image'), { Entite: { Logo: null } })).toBe('');
  });
});
