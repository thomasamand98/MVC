# Modes de saisie/affichage — comparatif

Un sélecteur est affiché en haut de chaque page tableau (`CrudPage.tsx`) et
permet de basculer entre 8 visuels différents pour la création/modification
d'un enregistrement. Le choix est le même pour toutes les pages et mémorisé
en local (`localStorage`, clé `crud-view-mode`).

## Les 8 modes

| id | Fichier | Description |
|---|---|---|
| `modal` | `ModalMode.tsx` | Comportement **actuel** : fenêtre centrée par-dessus le tableau. |
| `drawer` | `DrawerMode.tsx` | Panneau ("fiche") qui glisse depuis le bord droit, pleine hauteur. |
| `inline` | `InlinePanelMode.tsx` | Bloc rétractable au-dessus du tableau, qui le pousse vers le bas au lieu de le recouvrir. |
| `split` | `SplitViewMode.tsx` | Vue divisée façon maître-détail : colonne fixe à droite du tableau, toujours visible (affiche un message d'invite quand rien n'est sélectionné). |
| `sheet` | `BottomSheetMode.tsx` | Panneau qui glisse depuis le bas de l'écran, façon application mobile. |
| `fullscreen` | `FullScreenMode.tsx` | Le formulaire recouvre toute la fenêtre, comme une page dédiée avec bouton « Retour ». |
| `row-expand` | `RowExpandMode.tsx` | Hybride : la **création** reprend le bloc du haut (comme `inline`) ; la **modification** déplie directement la ligne concernée dans le tableau, la fiche s'affichant entre cette ligne et la suivante. |
| `tab` | `TabMode.tsx` | La fiche s'ouvre dans son propre onglet, dans la barre d'onglets globale de l'application (voir `layout/TabsContext.tsx`), pas dans la page tableau elle-même. Plusieurs fiches peuvent être ouvertes en même temps ; redouble-cliquer une ligne déjà ouverte réactive son onglet. |

Les 6 premiers partagent tous la même interface (`types.ts` →
`ViewModeContainerProps`) : ils reçoivent le tableau déjà construit
(`table`) et le formulaire déjà rendu (`form`), et décident chacun où les
placer. C'est ce qui permet de les garder totalement indépendants les uns
des autres.

`row-expand` a besoin d'agir sur le tableau lui-même (insérer une ligne sous
celle en cours d'édition), pas seulement sur ce qui l'entoure. Le câblage
correspondant vit dans `CrudPage.tsx` :
- `DataTable.tsx` accepte deux props optionnelles, `expandedRowId` et
  `renderExpandedRow`, ignorées par tous les autres modes.
- `CrudPage.tsx` ne les renseigne que lorsque `row-expand` est actif et
  qu'une ligne est en cours de modification, en habillant le formulaire avec
  `RowFicheContent` (exporté par `RowExpandMode.tsx`).
- Pour supprimer ce mode : retirer son entrée de `index.ts`, supprimer
  `RowExpandMode.tsx`/`.css`, puis dans `CrudPage.tsx` retirer les props
  `expandedRowId`/`renderExpandedRow` du `<DataTable>` et la logique
  `isRowExpandMode`/`modeFormSlot` (revenir à `form={formContent}`) ; enfin,
  dans `DataTable.tsx`, les props `expandedRowId`/`renderExpandedRow`
  peuvent être retirées si aucun autre mode ne les utilise.

`tab` ne s'appuie pas du tout sur `ViewModeContainerProps.form`/`open` — sa
logique vit directement dans `CrudPage.tsx` (`isTabMode`, `openRecordTab`,
`handleRowDoubleClickTab`) qui appelle `openOrActivateTab`/`closeTab` du
`TabsContext` (fourni par `AppLayout.tsx`) pour ouvrir la fiche dans la barre
d'onglets globale plutôt que dans son propre arbre React. Son `Component`
(`TabMode.tsx`) ne fait qu'afficher le tableau seul.
- Pour supprimer ce mode : retirer son entrée de `index.ts`, supprimer
  `TabMode.tsx`, puis dans `CrudPage.tsx` retirer `isTabMode`,
  `recordTabId`, `getRowLabel`, `handleSubmitTab`, `openRecordTab`,
  `handleRowDoubleClickTab` et leurs branchements dans
  `handleRowDoubleClick`/`onCreate`. `TabsContext.tsx` et le câblage dans
  `AppLayout.tsx` (onglets dynamiques) peuvent rester si d'autres besoins
  d'onglets dynamiques existent, ou être retirés sinon.

## Comment ne garder qu'un seul mode

1. Choisir le mode préféré en testant le sélecteur dans l'app.
2. Dans `index.ts`, supprimer les entrées du tableau `viewModes` pour les
   modes non retenus (et leurs imports en haut du fichier).
3. Supprimer les fichiers `.tsx`/`.css` correspondants dans ce dossier.
4. Une fois qu'il ne reste qu'un seul mode dans `viewModes` :
   - Le sélecteur (`ViewModeSelector`) et `useViewModePreference` ne servent
     plus à rien : dans `CrudPage.tsx`, remplacer l'appel au mode choisi par
     un import direct du composant restant (ex. `<DrawerMode ... />`), puis
     supprimer `ViewModeSelector.tsx/css` et `useViewModePreference.ts`.
   - Retirer `<ViewModeSelector .../>` du JSX de `CrudPage.tsx`.

## Comment ajouter un nouveau mode

Créer `MonMode.tsx` (+ `.css` si besoin) avec la même signature que les
autres (`ViewModeContainerProps`), puis l'ajouter dans `viewModes`
(`index.ts`) avec une icône dans `icons.tsx`.
