// Petites icônes utilisées par ViewModeSelector — une par mode, même style
// que les icônes déjà présentes dans CrudPage.tsx / PageActions.tsx (trait
// simple, 24x24, currentColor).

export function ModalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" opacity={0.35} />
      <rect x="7" y="7.5" width="10" height="9" rx="1.5" />
    </svg>
  )
}

export function DrawerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2" opacity={0.35} />
      <rect x="14" y="4" width="6.5" height="16" rx="0" />
    </svg>
  )
}

export function InlinePanelIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="6" rx="1.5" />
      <path d="M6.5 15h11" opacity={0.35} />
      <path d="M6.5 18.5h7" opacity={0.35} />
    </svg>
  )
}

export function SplitViewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4" width="10" height="16" rx="1.5" opacity={0.35} />
      <rect x="15" y="4" width="5.5" height="16" rx="1.5" />
    </svg>
  )
}

export function BottomSheetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2" opacity={0.35} />
      <rect x="3.5" y="13.5" width="17" height="6.5" rx="0" />
    </svg>
  )
}

export function RowExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 6.5h17" />
      <path d="M3.5 11h17" opacity={0.35} />
      <rect x="3.5" y="14.5" width="17" height="5" rx="1.5" />
    </svg>
  )
}

export function TabIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8h6.5l1.5 2h9v10.5h-17z" opacity={0.35} />
      <path d="M3.5 8V5.5h6.5L11.5 8" />
    </svg>
  )
}

export function FullScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4H5a1 1 0 0 0-1 1v4" />
      <path d="M15 4h4a1 1 0 0 1 1 1v4" />
      <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
      <path d="M15 20h4a1 1 0 0 0 1-1v-4" />
    </svg>
  )
}
