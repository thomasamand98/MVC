// ===== MODEL (logique métier, pure) =====
// Résout le HTML produit par l'éditeur de modèles (voir
// frontend/src/features/documents/DocumentTemplateEditor.tsx) contre des
// données réelles : remplace les jetons `[data-merge-field="Chemin"]` par
// leur valeur et développe les blocs répétables
// `[data-repeat-list="Chemin[]"]` (une copie de la ligne modèle
// `.dte-repeat-row` par élément de la liste). Fonctions pures, sans accès
// base de données — le contexte (`MergeContext`) est déjà construit par
// l'appelant (voir contrat.service.ts, getContratMergeContext) à partir des
// mêmes chemins que frontend/src/features/documents/mergeFields.ts.
//
// Convention de chemin : "Contrat.Prestations[].Prix_unitaire" — chaque
// segment "Xxx[]" désigne un tableau ; en dehors de tout bloc répétable, il
// se résout à ce tableau lui-même (getNested), à l'intérieur d'un bloc
// répétable dont c'est la liste, à l'élément courant (voir `resolvePath`).
import * as cheerio from 'cheerio';

export type MergeContext = Record<string, unknown>;

// Un "scope" borne la portée d'un préfixe de chemin à une valeur : le scope
// racine (prefix vide) couvre tout le contexte, et chaque bloc répétable
// traité empile un scope dont le préfixe est le chemin de sa liste (ex.
// "Contrat.Prestations[]."), pointant vers l'élément courant du tableau.
type Scope = { prefix: string; value: unknown };

// Un chemin peut traverser plus d'un niveau de liste (ex.
// "Contrat.Prestations[].PrestationSupplementaires[]" — les suppléments de
// TOUTES les prestations, utilisé quand ce groupe est déposé comme bloc
// indépendant plutôt qu'imbriqué dans celui des prestations, voir
// mergeFields.ts). Rencontrer un tableau en cours de chemin (donc PAS
// encore borné par un scope, voir resolvePath) déroule alors le reste du
// chemin sur chaque élément et aplatit les résultats, plutôt que d'échouer
// (un tableau n'a pas de propriété portant le nom du segment suivant).
function getNested(value: unknown, dottedPath: string): unknown {
  if (!dottedPath) return value;
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const result = getNested(item, dottedPath);
      return Array.isArray(result) ? result : [result];
    });
  }
  if (value === null || value === undefined) return undefined;
  const [rawKey, ...restParts] = dottedPath.split('.');
  // "Prestations[]" -> clé réelle "Prestations" (le "[]" ne marque le
  // chemin que côté éditeur/merge, jamais dans la donnée elle-même).
  const key = rawKey.replace(/\[\]$/, '');
  const next = (value as Record<string, unknown>)[key];
  const rest = restParts.join('.');
  return rest ? getNested(next, rest) : next;
}

// Résout un chemin absolu contre la pile de scopes : le scope le plus
// spécifique (le dernier empilé dont le préfixe correspond) l'emporte, pour
// que "Contrat.Prestations[].Prix_unitaire" se résolve contre l'élément de
// prestation courant plutôt que contre la racine une fois à l'intérieur de
// son bloc répétable.
function resolvePath(scopes: Scope[], path: string): unknown {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i];
    if (path.startsWith(scope.prefix)) {
      return getNested(scope.value, path.slice(scope.prefix.length));
    }
  }
  return undefined;
}

// `kind` vient de data-kind, posé par l'éditeur sur chaque jeton (voir
// domInsert.ts, createChipElement) — indique comment afficher la valeur
// brute renvoyée par Prisma (Decimal, Date...).
function formatValue(raw: unknown, kind: string | undefined): string {
  if (raw === null || raw === undefined) return '';
  if (kind === 'date') {
    const date = raw instanceof Date ? raw : new Date(String(raw));
    return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleDateString('fr-BE');
  }
  if (kind === 'number') {
    const hasToNumber = typeof raw === 'object' && raw !== null && typeof (raw as { toNumber?: unknown }).toNumber === 'function';
    const num = hasToNumber ? (raw as { toNumber(): number }).toNumber() : Number(raw);
    return Number.isNaN(num) ? String(raw) : num.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(raw);
}

// Remplace chaque jeton `[data-merge-field]` trouvé sous `root` par sa
// valeur formatée (texte brut, plus de chip/bouton de suppression). Ne
// descend pas dans les blocs répétables non encore développés (traités par
// expandRepeats avant d'être atteints, voir resolveMergeHtml).
//
// kind="image" (ex. Entite.Logo) : la valeur est déjà une chaîne exploitable
// telle quelle comme `src` (data: URI en base64, voir entite.service.ts) —
// remplacée par une vraie <img>, ou simplement retirée si aucun logo n'est
// défini (pas d'image cassée dans le PDF).
function resolveChips($: cheerio.CheerioAPI, root: cheerio.Cheerio<any>, scopes: Scope[]) {
  root.find('[data-merge-field]').each((_, el) => {
    const $el = $(el);
    const path = $el.attr('data-merge-field') ?? '';
    const kind = $el.attr('data-kind');
    const raw = resolvePath(scopes, path);

    if (kind === 'image') {
      const src = typeof raw === 'string' ? raw : '';
      if (src) $el.replaceWith($('<img class="dte-merged-image">').attr('src', src));
      else $el.remove();
      return;
    }

    $el.replaceWith($('<span class="dte-merged"></span>').text(formatValue(raw, kind)));
  });
}

// Développe les blocs répétables trouvés sous `root`, un niveau à la fois :
// pour chaque bloc de premier niveau (pas imbriqué dans un autre bloc non
// encore traité), clone sa ligne modèle (`.dte-repeat-row`) une fois par
// élément de la liste, résout ses jetons contre un scope pointant sur cet
// élément, puis traite récursivement les éventuels blocs imbriqués dans
// cette copie (aucun modèle de l'éditeur n'en produit aujourd'hui — la
// palette insère toujours les listes imbriquées comme blocs indépendants,
// voir mergeFields.ts — mais l'algorithme reste correct si un jour un
// modèle en contient).
function expandRepeats($: cheerio.CheerioAPI, root: cheerio.Cheerio<any>, scopes: Scope[]) {
  const topLevelBlocks = root.find('[data-repeat-list]').filter((_, el) => $(el).parents('[data-repeat-list]').length === 0);

  topLevelBlocks.each((_, el) => {
    const $block = $(el);
    const listPath = $block.attr('data-repeat-list') ?? '';
    const templateRow = $block.find('.dte-repeat-row').first();
    $block.find('.dte-repeat-tag').remove();
    if (templateRow.length === 0) return;

    const rawItems = resolvePath(scopes, listPath);
    const items = Array.isArray(rawItems) ? rawItems : [];

    const clones = items.map((item) => {
      const clone = templateRow.clone();
      const itemScopes = [...scopes, { prefix: `${listPath}.`, value: item }];
      // Développer les blocs imbriqués d'abord : sinon resolveChips trouverait
      // aussi les jetons du bloc imbriqué pas encore développé et les
      // résoudrait contre le tableau entier (via l'aplatissement de
      // getNested), au lieu de les laisser à expandRepeats qui les résout un
      // par un pour chaque élément de la sous-liste.
      expandRepeats($, clone, itemScopes);
      resolveChips($, clone, itemScopes);
      return clone;
    });

    if (clones.length > 0) {
      templateRow.after(...clones);
    }
    templateRow.remove();
  });
}

// Point d'entrée : résout un modèle complet contre son contexte de données
// et renvoie le HTML fini, prêt à être imprimé (voir PdfRendererService) —
// plus aucun attribut/élément propre à l'éditeur (data-merge-field restants,
// contenteditable, boutons de suppression).
export function resolveMergeHtml(templateHtml: string, context: MergeContext): string {
  const $ = cheerio.load(`<div id="dte-merge-root">${templateHtml}</div>`);
  const root = $('#dte-merge-root');
  const rootScope: Scope[] = [{ prefix: '', value: context }];

  expandRepeats($, root, rootScope);
  resolveChips($, root, rootScope);

  root.find('[contenteditable]').removeAttr('contenteditable');
  root.find('[data-chip-remove]').remove();
  root.find('[data-repeat-list]').removeAttr('data-repeat-list').removeAttr('data-repeat-label');

  return root.html() ?? '';
}
