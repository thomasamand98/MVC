import type { SVGProps } from 'react'

// Icônes de l'éditeur de modèles de document (mêmes conventions que
// components/PageActions.tsx : 1em, currentColor, décoratives).
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export const PlusIcon = () => (
  <Icon strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16" />
    <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
)

export const CopyIcon = () => (
  <Icon>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M4 16V5a1 1 0 0 1 1-1h11" />
  </Icon>
)

export const DocumentIcon = () => (
  <Icon>
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </Icon>
)

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
)

export const GripIcon = () => (
  <Icon strokeWidth={2.2}>
    <circle cx="9" cy="6" r="0.6" fill="currentColor" />
    <circle cx="9" cy="12" r="0.6" fill="currentColor" />
    <circle cx="9" cy="18" r="0.6" fill="currentColor" />
    <circle cx="15" cy="6" r="0.6" fill="currentColor" />
    <circle cx="15" cy="12" r="0.6" fill="currentColor" />
    <circle cx="15" cy="18" r="0.6" fill="currentColor" />
  </Icon>
)

export const BoldIcon = () => (
  <Icon>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
    <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </Icon>
)

export const ItalicIcon = () => (
  <Icon>
    <path d="M11 5h6M7 19h6M14 5 10 19" />
  </Icon>
)

export const UnderlineIcon = () => (
  <Icon>
    <path d="M6 4v7a6 6 0 0 0 12 0V4" />
    <path d="M5 20h14" />
  </Icon>
)

export const AlignLeftIcon = () => (
  <Icon>
    <path d="M4 6h16M4 12h10M4 18h14" />
  </Icon>
)

export const AlignCenterIcon = () => (
  <Icon>
    <path d="M4 6h16M7 12h10M5 18h14" />
  </Icon>
)

export const AlignRightIcon = () => (
  <Icon>
    <path d="M4 6h16M10 12h10M6 18h14" />
  </Icon>
)

export const ListIcon = () => (
  <Icon>
    <circle cx="5" cy="6" r="0.8" fill="currentColor" />
    <circle cx="5" cy="12" r="0.8" fill="currentColor" />
    <circle cx="5" cy="18" r="0.8" fill="currentColor" />
    <path d="M9 6h11M9 12h11M9 18h11" />
  </Icon>
)

export const TableIcon = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 10h17M3.5 15h17M10 4.5v15" />
  </Icon>
)

export const RepeatIcon = () => (
  <Icon>
    <path d="M4 12a8 8 0 0 1 14-5" />
    <path d="M20 12a8 8 0 0 1-14 5" />
    <path d="M18 3v4h-4M6 21v-4h4" />
  </Icon>
)

export const PageBreakIcon = () => (
  <Icon>
    <path d="M7 3v6M17 3v6M7 21v-6M17 21v-6" />
    <path d="M4 12h16" strokeDasharray="2.5 2.5" />
  </Icon>
)

export const PageNumberIcon = () => (
  <Icon>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 9h1M8 15h1M15 9h1M15 15h1" strokeWidth={2.4} />
  </Icon>
)

export const UndoIcon = () => (
  <Icon>
    <path d="M9 10 4.5 6 9 2" />
    <path d="M4.5 6H14a6 6 0 1 1 0 12H8" />
  </Icon>
)

export const RedoIcon = () => (
  <Icon>
    <path d="m15 10 4.5-4L15 2" />
    <path d="M19.5 6H10a6 6 0 1 0 0 12h6" />
  </Icon>
)

export const CloseIcon = () => (
  <Icon strokeWidth={2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)
