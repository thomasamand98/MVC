import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { Sidebar, type MenuNode } from './Sidebar.js'
import './AppLayout.css'
import {
  DashboardIcon,
  CommercialIcon,
  AttelageIcon,
  ProductionIcon,
  PersonnelIcon,
  DocumentaireIcon,
  ConfigurationIcon,
  MenuIcon,
  CloseIcon,
} from './icons.js'
import { Dev } from '../features/enDeveloppement/Dev.js'
import { SocietesPage } from '../features/societes/SocietesPage.js'
import { ContratsPage } from '../features/contrats/ContratsPage.js'
import { ContactsPage } from '../features/contacts/ContactsPage.js'
import { PointsPage } from '../features/points/PointsPage.js'
import { ConditionsPage } from '../features/conditions/ConditionsPage.js'
import { MarchandisesPage } from '../features/marchandises/MarchandisesPage.js'
import { ChauffeursPage } from '../features/chauffeurs/ChauffeursPage.js'
import { VehiculesPage } from '../features/vehicules/VehiculesPage.js'
import { AttelagesPage } from '../features/attelages/AttelagesPage.js'
import { CommandesPage } from '../features/commandes/CommandesPage.js'
import { PersonnelPage } from '../features/personnel/PersonnelPage.js'
import { PointagePage } from '../features/pointage/PointagePage.js'

type MenuLeafConfig = { id: string; label: string; icon?: ReactNode; render: () => ReactElement }
type MenuGroupConfig = { id: string; label: string; icon?: ReactNode; items: MenuLeafConfig[] }

// Menu de navigation : une entrée sans `items` (ex. "Tableau de bord")
// est directement sélectionnable. "Commercial" regroupe les tables
// métier — pour ajouter un thème, ajoute un groupe ici ; pour ajouter
// une table à un thème existant, ajoute un item à son tableau `items`.
// L'icône n'est affichée que sur les entrées principales, pas sur les
// items d'un groupe déroulé.
const MENU: (MenuLeafConfig | MenuGroupConfig)[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <DashboardIcon />, render: () => <Dev /> },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: <CommercialIcon />,
    items: [
      { id: 'societes', label: 'Société', render: () => <SocietesPage /> },
      { id: 'contrats', label: 'Contrats / Offre de prix', render: () => <ContratsPage /> },
      { id: 'contacts', label: 'Contacts', render: () => <ContactsPage /> },
      { id: 'point', label: 'Point', render: () => <PointsPage /> },
      { id: 'conditions', label: "Conditions d'exécution", render: () => <ConditionsPage /> },
      { id: 'marchandises', label: 'Marchandises', render: () => <MarchandisesPage /> },
    ],
  },
  {
    id: 'attelage',
    label: 'Gestion attelage',
    icon: <AttelageIcon />,
    items: [
      { id: 'chauffeurs', label: 'Chauffeurs', render: () => <ChauffeursPage /> },
      { id: 'vehicules', label: 'Véhicules', render: () => <VehiculesPage /> },
      { id: 'attelages', label: 'Attelages', render: () => <AttelagesPage /> },
    ]
  },
  {
    id: 'production',
    label: 'Production',
    icon: <ProductionIcon />,
    items: [
      { id: 'commandes', label: 'Commandes', render: () => <CommandesPage /> },
      { id: 'planning', label: 'Planning', render: () => <Dev /> },
      { id: 'executions', label: 'Exécutions', render: () => <Dev /> },
    ]
  },
  {
    id: 'personnel',
    label: 'Gestion personnel',
    icon: <PersonnelIcon />,
    items: [
      { id: 'personnel', label: 'Personnel', render: () => <PersonnelPage /> },
      { id: 'pointage', label: 'Pointage', render: () => <PointagePage /> },
    ]
  },
  { id: 'documentaire', label: 'Gestion documentaire', icon: <DocumentaireIcon />, render: () => <Dev /> },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: <ConfigurationIcon />,
    items: [
      { id: 'general', label: 'Général', render: () => <Dev /> },
      { id: 'societe', label: 'Société', render: () => <Dev /> },
      { id: 'bdd', label: 'Base de données', render: () => <Dev /> },
      { id: 'comptabilite', label: 'Comptabilité', render: () => <Dev /> },
      { id: 'enumerations', label: 'Enumérations', render: () => <Dev /> },
      { id: 'outils', label: 'Outils', render: () => <Dev /> },
      { id: 'donnees', label: 'Données brutes', render: () => <Dev /> },
      { id: 'import-export', label: 'Import/Export', render: () => <Dev /> },
    ]
  },
]

const MENU_NODES: MenuNode[] = MENU

const MENU_ITEMS: MenuLeafConfig[] = MENU.flatMap((node) => ('items' in node ? node.items : [node]))

const ACTIVE_MENU_STORAGE_KEY = 'mvc-template:activeMenuId'

// Récupération du dernier onglet actif
function getInitialActiveId(): string {
  const stored = localStorage.getItem(ACTIVE_MENU_STORAGE_KEY)
  if (stored && MENU_ITEMS.some((item) => item.id === stored)) return stored
  return 'dashboard'
}

export function AppLayout() {
  const [activeId, setActiveId] = useState(getInitialActiveId)
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeItem = MENU_ITEMS.find((item) => item.id === activeId)!

  // Bloque le scroll de la page pendant que le tiroir mobile est ouvert.
  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  // Affiche l'onglet et le stock comme dernier onglet actif
  function handleSelect(itemId: string) {
    setActiveId(itemId)
    localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, itemId)
  }

  return (
    <div className="app-layout">
      <button
        type="button"
        className="app-layout-menu-toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
      <Sidebar
        nodes={MENU_NODES}
        activeId={activeId}
        onSelect={handleSelect}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div style={{ flex: 1, minWidth: 0 }}>{activeItem.render()}</div>
    </div>
  )
}
