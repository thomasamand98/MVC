import type { ReactNode } from 'react'
import { useTabsContext } from '../../layout/TabsContext.js'
import { SocietesPage } from '../../features/societes/SocietesPage.js'
import { ContratsPage } from '../../features/contrats/ContratsPage.js'
import { CommandesPage } from '../../features/commandes/CommandesPage.js'
import { ContactsPage } from '../../features/contacts/ContactsPage.js'
import { ChauffeursPage } from '../../features/chauffeurs/ChauffeursPage.js'
import { PersonnelPage } from '../../features/personnel/PersonnelPage.js'
import { VehiculesPage } from '../../features/vehicules/VehiculesPage.js'
import { AttelagesPage } from '../../features/attelages/AttelagesPage.js'
import { PointagePage } from '../../features/pointage/PointagePage.js'
import { PointsPage } from '../../features/points/PointsPage.js'
import { MarchandisesPage } from '../../features/marchandises/MarchandisesPage.js'
import { ProjectionContext, type ProjectionRequest } from './ProjectionContext.js'
import { ENTITIES, RELATIONS, type EntityKey, type ProjectionView } from './relations.js'

// Page à afficher dans l'onglet résultat, par table cible.
const PAGES: Record<EntityKey, (projection: ProjectionView) => ReactNode> = {
  societes: (p) => <SocietesPage projection={p} />,
  contrats: (p) => <ContratsPage projection={p} />,
  commandes: (p) => <CommandesPage projection={p} />,
  contacts: (p) => <ContactsPage projection={p} />,
  chauffeurs: (p) => <ChauffeursPage projection={p} />,
  personnel: (p) => <PersonnelPage projection={p} />,
  vehicules: (p) => <VehiculesPage projection={p} />,
  attelages: (p) => <AttelagesPage projection={p} />,
  pointage: (p) => <PointagePage projection={p} />,
  points: (p) => <PointsPage projection={p} />,
  marchandises: (p) => <MarchandisesPage projection={p} />,
}

// Ouvre le résultat d'une projection (bouton Projection de CrudPage.tsx)
// dans un onglet de l'appli : la page standard de la table cible, filtrée
// côté serveur sur les lignes d'origine. Même sélection → même onglet
// (réactivé plutôt que dupliqué).
export function ProjectionProvider({ children }: { children: ReactNode }) {
  const { openOrActivateTab } = useTabsContext()

  function openProjection({ source, target, ids, singleLabel }: ProjectionRequest) {
    const origin = ids.length === 1 && singleLabel ? singleLabel : `${ids.length} ${ENTITIES[source].plural}`
    const heading = `${ENTITIES[target].title} de ${origin}`
    const defaultField = RELATIONS[source].find((r) => r.target === target)?.defaultField
    const view: ProjectionView = {
      source,
      ids,
      heading,
      defaults: ids.length === 1 && defaultField ? { [defaultField]: ids[0] } : {},
    }
    openOrActivateTab({
      id: `projection:${source}:${target}:${[...ids].sort().join(',')}`,
      label: heading,
      content: PAGES[target](view),
    })
  }

  return <ProjectionContext.Provider value={{ openProjection }}>{children}</ProjectionContext.Provider>
}
