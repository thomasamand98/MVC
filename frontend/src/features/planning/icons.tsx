import type { ReactNode, SVGProps } from 'react'

// Icônes de l'écran Planning — même style que layout/icons.tsx (traits
// fins, `currentColor`).
function IconBase({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const ChevronLeftIcon = (p: P) => <IconBase {...p}><path d="m15 18-6-6 6-6" /></IconBase>
export const ChevronRightIcon = (p: P) => <IconBase {...p}><path d="m9 18 6-6-6-6" /></IconBase>
export const SearchIcon = (p: P) => <IconBase {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></IconBase>
export const CloseIcon = (p: P) => <IconBase {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconBase>
export const TrashIcon = (p: P) => (
  <IconBase {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </IconBase>
)
export const RouteIcon = (p: P) => (
  <IconBase {...p}>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
  </IconBase>
)
export const TruckIcon = (p: P) => (
  <IconBase {...p}>
    <path d="M3 6h11v10H3z" />
    <path d="M14 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
  </IconBase>
)
export const UserIcon = (p: P) => <IconBase {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></IconBase>
export const PanelIcon = (p: P) => <IconBase {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></IconBase>
export const ColumnsIcon = (p: P) => <IconBase {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M15 4v16" /></IconBase>
export const RowsIcon = (p: P) => <IconBase {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9.5h18" /><path d="M3 14.5h18" /></IconBase>
export const GripIcon = (p: P) => (
  <IconBase {...p} strokeWidth={2.4}>
    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
  </IconBase>
)
