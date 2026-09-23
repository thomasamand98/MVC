# Impression PDF

Ce document explique comment un contrat (ou tout autre enregistrement) devient
un fichier PDF téléchargeable : le modèle de document (mise en page éditée à
la souris), le moteur de fusion (remplace les champs par les vraies données)
et le rendu PDF (Chromium headless).

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Le modèle de document](#le-modèle-de-document)
3. [L'éditeur de modèle (frontend)](#léditeur-de-modèle-frontend)
4. [Le moteur de fusion (backend)](#le-moteur-de-fusion-backend)
5. [Le rendu PDF (Puppeteer)](#le-rendu-pdf-puppeteer)
6. [La route d'impression d'un contrat](#la-route-dimpression-dun-contrat)
7. [Le bouton « Voir le PDF » (frontend)](#le-bouton--voir-le-pdf--frontend)
8. [Ajouter l'impression à un autre type de document](#ajouter-limpression-à-un-autre-type-de-document)
9. [Tester](#tester)
10. [Limites connues](#limites-connues)

## Vue d'ensemble

```
 1. Un utilisateur crée/édite un modèle dans l'éditeur (souris, glisser-déposer)
    → du HTML est stocké tel quel en base (3 zones : en-tête / contenu / pied)

 2. Un utilisateur clique « Voir le PDF » sur une fiche contrat
    → GET /contrats/:id/pdf?templateId=X

 3. Backend :
    ContratController          → charge le contrat + construit le contexte de données
      → DocumentMergeService   → charge le HTML du modèle (3 zones)
        → resolveMergeHtml()   → remplace les jetons du HTML par les vraies valeurs
      → PdfRendererService     → transforme le HTML fini en PDF (Chromium headless)
    ← Buffer PDF (Content-Type: application/pdf)

 4. Frontend : télécharge le PDF (avec le jeton d'auth), l'ouvre dans un nouvel onglet
```

Trois briques indépendantes, qui ne se connaissent pas entre elles :

| Brique | Rôle | Ne sait rien de |
|---|---|---|
| **Modèle de document** (`document-template`) | Stocke le HTML des 3 zones | La donnée réelle, ni le type de document (contrat, facture…) |
| **Moteur de fusion** (`document-merge`) | Remplace les jetons par des valeurs, produit le PDF | D'où vient le contexte (contrat, facture…) |
| **Module métier** (`contrat`, plus tard `facture`…) | Construit le contexte de données, expose la route `/pdf` | Comment le HTML est fusionné ou rendu |

## Le modèle de document

Un modèle (`document_templates` en base, `backend/prisma/schema.prisma`) a
trois zones de HTML **indépendantes**, résolues avec **le même contexte** :

| Champ | Rôle |
|---|---|
| `Contenu_entete` | Répété en haut de chaque page imprimée (ex. logo) |
| `Contenu_html` | Le contenu principal, affiché une fois |
| `Contenu_pied` | Répété en bas de chaque page (ex. CGV, numéro de page) |
| `Type_document` | Ex. `"CONTRAT"` — filtre les modèles proposés sur la fiche contrat |

CRUD classique (`backend/src/document-template/`) :

```ts
// document-template.controller.ts
@Get('document-templates')              // ?type=CONTRAT (optionnel)
@Get('document-templates/:id')          // modèle complet (avec le HTML)
@Post('document-templates')
@Patch('document-templates/:id')
@Delete('document-templates/:id')
```

## L'éditeur de modèle (frontend)

`frontend/src/features/documents/DocumentTemplateEditor.tsx` est un éditeur
WYSIWYG : trois zones `contentEditable`, une palette de champs à glisser-déposer
(`MergeFieldPalette.tsx`), qui insère dans le HTML des éléments avec des
attributs `data-*` reconnus plus tard par le moteur de fusion.

**Le catalogue des champs disponibles** (`mergeFields.ts`) — un chemin par
champ, qui reprend les noms des modèles Prisma :

```ts
export const MERGE_FIELD_GROUPS: MergeFieldGroup[] = [
  {
    id: 'contrat',
    label: 'Contrat',
    fields: [
      { path: 'Contrat.Num_contrat', label: 'N° contrat', kind: 'text' },
      { path: 'Contrat.Date_debut', label: 'Date de début', kind: 'date' },
      // ...
    ],
  },
  {
    id: 'prestations',
    label: 'Prestations',
    listPath: 'Contrat.Prestations[]',       // groupe "liste" = bloc répétable
    fields: [
      { path: 'Contrat.Prestations[].Type', label: 'Type', kind: 'text' },
      { path: 'Contrat.Prestations[].Prix_unitaire', label: 'P.U.', kind: 'number' },
      // ...
    ],
  },
]
```

**Un champ simple** se dépose comme un jeton (`domInsert.ts`) :

```html
<span class="dte-chip" data-merge-field="Contrat.Num_contrat" data-kind="text">
  N° contrat<button data-chip-remove>×</button>
</span>
```

**Un groupe "liste"** se dépose comme un tableau répétable — une ligne
« modèle » (`.dte-repeat-row`) qui sera dupliquée une fois par élément au
moment de la fusion :

```html
<div class="dte-repeat" data-repeat-list="Contrat.Prestations[]">
  <table class="dte-table">
    <thead><tr><th>Type</th><th>P.U.</th></tr></thead>
    <tbody>
      <tr class="dte-repeat-row">
        <td><span class="dte-chip" data-merge-field="Contrat.Prestations[].Type" data-kind="text">Type</span></td>
        <td><span class="dte-chip" data-merge-field="Contrat.Prestations[].Prix_unitaire" data-kind="number">P.U.</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

À la sauvegarde, l'éditeur envoie simplement le HTML de chacune des trois
zones (`innerHTML` des trois canvas) via `PATCH /document-templates/:id`. Rien
n'est interprété côté frontend : c'est du HTML brut, stocké tel quel.

## Le moteur de fusion (backend)

`backend/src/document-merge/merge-html.ts` — une fonction **pure**, sans accès
base de données : elle prend le HTML d'un modèle et un objet `MergeContext`
(déjà construit par l'appelant), et renvoie le HTML fini.

```ts
export type MergeContext = Record<string, unknown>

export function resolveMergeHtml(templateHtml: string, context: MergeContext): string {
  // 1. Développe les blocs [data-repeat-list] : une copie de .dte-repeat-row
  //    par élément du tableau pointé par le chemin (ex. "Contrat.Prestations[]")
  // 2. Remplace chaque [data-merge-field="Chemin"] par sa valeur formatée
  //    (résolue contre le contexte, en tenant compte du tableau courant si
  //    on est à l'intérieur d'un bloc répétable)
}
```

Exemple concret : avec ce contexte...

```ts
const context = {
  Contrat: {
    Num_contrat: 'C-2026-042',
    Prestations: [
      { Type: 'Transport', Prix_unitaire: 150 },
      { Type: 'Stockage', Prix_unitaire: 80 },
    ],
  },
}
```

...le jeton `data-merge-field="Contrat.Num_contrat"` devient `C-2026-042`, et
la ligne `.dte-repeat-row` du tableau `Contrat.Prestations[]` est dupliquée
deux fois (une par prestation), chaque copie résolvant ses jetons contre sa
propre prestation plutôt que contre la liste entière.

`kind` (posé par l'éditeur, voir `data-kind`) contrôle le formatage : les
dates passent par `toLocaleDateString('fr-BE')`, les nombres (y compris les
`Decimal` Prisma) par `toLocaleString('fr-BE', { minimumFractionDigits: 2 })`,
et `kind="image"` remplace le jeton par une vraie balise `<img>`.

**Orchestration** (`document-merge.service.ts`) — charge le modèle, résout les
trois zones avec le même contexte, délègue le rendu :

```ts
@Injectable()
export class DocumentMergeService {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly pdfRendererService: PdfRendererService,
  ) {}

  async renderPdf(templateId: bigint, context: MergeContext): Promise<Buffer> {
    const content = await this.documentTemplateService.getDocumentTemplateContent(templateId)
    return this.pdfRendererService.renderPdf({
      headerHtml: content.Contenu_entete ? resolveMergeHtml(content.Contenu_entete, context) : '',
      bodyHtml: resolveMergeHtml(content.Contenu_html, context),
      footerHtml: content.Contenu_pied ? resolveMergeHtml(content.Contenu_pied, context) : '',
    })
  }
}
```

## Le rendu PDF (Puppeteer)

`backend/src/document-merge/pdf-renderer.service.ts` transforme le HTML fini
en PDF via une instance **Chromium headless** (Puppeteer) : le vrai moteur de
mise en page d'un navigateur (sauts de page, tableaux qui continuent sur la
page suivante...), plutôt qu'une librairie qui approxime le rendu.

```ts
@Injectable()
export class PdfRendererService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null

  private getBrowser(): Promise<Browser> {
    // Une seule instance Chromium, démarrée au premier appel et réutilisée
    // entre les requêtes (le démarrage prend ~1s, trop lent à refaire à chaque PDF).
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    }
    return this.browserPromise
  }

  async renderPdf({ headerHtml, bodyHtml, footerHtml }: RenderInput): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.setContent(`<!doctype html><html><body>${bodyHtml}</body></html>`, { waitUntil: 'load' })
      return Buffer.from(await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '32mm', bottom: '20mm', left: '16mm', right: '16mm' },
        displayHeaderFooter: true,
        headerTemplate: headerHtml,   // rendu dans un cadre isolé (pas d'accès au <style> de la page)
        footerTemplate: footerHtml,
      }))
    } finally {
      await page.close()
    }
  }
}
```

Point important : `headerTemplate`/`footerTemplate` sont rendus par Chromium
dans un cadre **isolé**, sans accès aux styles de la page principale — c'est
pourquoi le fichier définit deux feuilles de style séparées
(`BODY_STYLESHEET` et `CHROME_STYLESHEET`) plutôt qu'une seule.

## La route d'impression d'un contrat

`backend/src/contrat/contrat.controller.ts` assemble tout, pour un contrat
donné :

```ts
@Get('contrats/:id/pdf')
async getContratPdf(@Param('id') id: string, @Query('templateId') templateId: string, @Res() res: Response) {
  if (!templateId) throw new BadRequestException('templateId requis')
  const context = await this.contratService.getContratMergeContext(BigInt(id))
  const pdf = await this.documentMergeService.renderPdf(BigInt(templateId), context)
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="contrat-${id}.pdf"` })
  res.send(pdf)
}
```

`getContratMergeContext` (`contrat.service.ts`) construit le contexte : il
suit **exactement les mêmes chemins** que `mergeFields.ts` côté frontend, pour
qu'un champ posé dans l'éditeur se résolve forcément contre quelque chose.

```ts
async getContratMergeContext(id: bigint): Promise<MergeContext> {
  const [contrat, entite, { enumerations: unites }] = await Promise.all([
    this.prisma.contrat.findUniqueOrThrow({ where: { IDCONTRATS: id }, select: contratMergeSelect }),
    this.entiteService.getEntite(),                                   // "Entite.*" (notre société)
    this.enumerationService.getEnumerations(undefined, 'unite_prestation'),
  ])

  return {
    Entite: entite,
    Divers: { Date_edition: new Date(), CGV_URL: process.env.CGV_URL || null },
    Contrat: {
      ...contrat,
      Prestations: contrat.Prestations.map((p) => ({ ...p /* + libellés d'unité résolus */ })),
    },
  }
}
```

## Le bouton « Voir le PDF » (frontend)

Un `<a href>` classique ne peut pas envoyer l'en-tête `Authorization` — la
route est protégée par JWT (voir `docs/securite-authentification.md`). Le
bouton télécharge donc le PDF via `apiFetch` (authentifié), puis l'ouvre
depuis un `Blob` :

```tsx
// frontend/src/features/contrats/ContratPdfButton.tsx
async function handleView() {
  const preview = window.open('', '_blank')   // ouvert AVANT l'attente réseau,
                                                // sinon le navigateur bloque le popup
  const res = await apiFetch(`contrats/${contratId}/pdf?templateId=${templateId}`)
  const blob = await res.blob()
  preview!.location.href = URL.createObjectURL(blob)
}
```

## Ajouter l'impression à un autre type de document

Pour imprimer, par exemple, une facture, sans toucher au moteur de fusion :

1. **Contexte** : ajouter `getFactureMergeContext(id)` dans `facture.service.ts`,
   qui renvoie un objet `{ Entite, Divers, Facture: {...} }` (même forme que
   `getContratMergeContext`).
2. **Champs de fusion** : ajouter un groupe `"facture"` dans `mergeFields.ts`
   (`Facture.Num_facture`, `Facture.Lignes[].Prix_unitaire`...), avec des
   chemins qui correspondent exactement aux clés du contexte ci-dessus.
3. **Route** : dans `facture.controller.ts`,

   ```ts
   @Get('factures/:id/pdf')
   async getFacturePdf(@Param('id') id: string, @Query('templateId') templateId: string, @Res() res: Response) {
     const context = await this.factureService.getFactureMergeContext(BigInt(id))
     const pdf = await this.documentMergeService.renderPdf(BigInt(templateId), context)
     res.set({ 'Content-Type': 'application/pdf' })
     res.send(pdf)
   }
   ```

4. **Modèle** : créer un modèle avec `Type_document: "FACTURE"` dans l'éditeur —
   il apparaîtra automatiquement dans le sélecteur si la fiche facture utilise
   `<ContratPdfButton templates={...} />` (ou un équivalent) filtré sur ce type.

`DocumentMergeService` et `PdfRendererService` n'ont besoin d'aucune
modification : ils ne connaissent que `MergeContext`, pas la Facture.

## Tester

```bash
# 1. Lister les modèles disponibles pour les contrats
curl <API>/document-templates?type=CONTRAT -H "Authorization: Bearer <token>"

# 2. Générer le PDF d'un contrat avec un modèle existant
curl -o contrat.pdf "<API>/contrats/8/pdf?templateId=6" -H "Authorization: Bearer <token>"

# 3. Modèle inexistant → 404 propre (pas un 500)
curl "<API>/contrats/8/pdf?templateId=999999" -H "Authorization: Bearer <token>"
# → {"statusCode":404,"message":"Modèle de document introuvable"}
```

## Limites connues

- **Un seul niveau d'imbrication réellement utilisé** : le moteur de fusion
  gère les blocs répétables imbriqués (`resolveMergeHtml` est récursif), mais
  la palette (`mergeFields.ts`) ne dépose aujourd'hui les sous-listes (ex.
  prestations supplémentaires) que comme blocs **indépendants**, pas imbriqués
  dans la ligne parente.
- **Puppeteer nécessite Chromium téléchargé** (`node_modules`/cache
  Puppeteer) — voir `docs/securite-authentification.md` pour le déploiement
  Railway ; sur un serveur dédié, prévoir les dépendances système de Chromium
  headless.
- **`CGV_URL`** (lien des conditions générales dans le pied de page) est une
  variable d'environnement backend, sans rapport avec le reste du système de
  fusion — voir `backend/.env.example`.
