import { formatMoney } from './dateUtils.js'
import type { PlanningResource } from './types.js'

// En-tête d'une ressource (colonne ou ligne) : nom, sous-titre, nombre
// d'exécutions et CA de la période.
export function ResourceHeader({ resource, ca, count }: { resource: PlanningResource; ca: number; count: number }) {
  return (
    <div className="pl-res">
      <div className="pl-res-name" title={resource.label}>{resource.label}</div>
      <div className="pl-res-meta">
        {resource.sublabel && <span className="pl-res-sub" title={resource.sublabel}>{resource.sublabel}</span>}
        <span className="pl-res-stats">
          {count} · <strong>{formatMoney(ca)}</strong>
        </span>
      </div>
    </div>
  )
}
