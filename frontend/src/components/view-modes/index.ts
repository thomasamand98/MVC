import { BottomSheetMode } from './BottomSheetMode.js'
import { DrawerMode } from './DrawerMode.js'
import { FullScreenMode } from './FullScreenMode.js'
import {
  BottomSheetIcon,
  DrawerIcon,
  FullScreenIcon,
  InlinePanelIcon,
  ModalIcon,
  RowExpandIcon,
  SplitViewIcon,
  TabIcon,
} from './icons.js'
import { InlinePanelMode } from './InlinePanelMode.js'
import { ModalMode } from './ModalMode.js'
import { ROW_EXPAND_MODE_ID, RowExpandMode } from './RowExpandMode.js'
import { SplitViewMode } from './SplitViewMode.js'
import { TAB_MODE_ID, TabMode } from './TabMode.js'
import type { ViewModeDefinition } from './types.js'

// Registre des modes proposés par ViewModeSelector — pour n'en garder
// qu'un seul, voir README.md de ce dossier : il suffit de retirer les
// entrées inutiles ici (et de supprimer leurs fichiers).
export const viewModes: ViewModeDefinition[] = [
  {
    id: 'modal',
    label: 'Modale',
    description: 'Fenêtre centrée par-dessus le tableau (comportement actuel).',
    icon: ModalIcon,
    Component: ModalMode,
  },
  {
    id: 'drawer',
    label: 'Panneau latéral',
    description: 'Fiche qui glisse depuis le bord droit, sur toute la hauteur.',
    icon: DrawerIcon,
    Component: DrawerMode,
  },
  {
    id: 'inline',
    label: 'Bloc en haut',
    description: 'Bloc rétractable au-dessus du tableau, qui le pousse vers le bas.',
    icon: InlinePanelIcon,
    Component: InlinePanelMode,
  },
  {
    id: 'split',
    label: 'Vue divisée',
    description: 'Colonne fixe à droite du tableau (maître-détail), toujours visible.',
    icon: SplitViewIcon,
    Component: SplitViewMode,
  },
  {
    id: 'sheet',
    label: 'Panneau du bas',
    description: 'Fiche qui glisse depuis le bas de l’écran, façon mobile.',
    icon: BottomSheetIcon,
    Component: BottomSheetMode,
  },
  {
    id: 'fullscreen',
    label: 'Plein écran',
    description: 'La fiche recouvre toute la fenêtre, comme une page dédiée.',
    icon: FullScreenIcon,
    Component: FullScreenMode,
  },
  {
    id: ROW_EXPAND_MODE_ID,
    label: 'Ligne + bloc',
    description: 'Création via le bloc du haut ; modification en dépliant la ligne dans le tableau.',
    icon: RowExpandIcon,
    Component: RowExpandMode,
  },
  {
    id: TAB_MODE_ID,
    label: 'Onglet',
    description: 'Ouvre la fiche dans son propre onglet, dans la barre en haut de l’application.',
    icon: TabIcon,
    Component: TabMode,
  },
]
