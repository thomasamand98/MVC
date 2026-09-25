import type { ReactNode } from 'react'
import './FicheLayout.css'

// Briques de mise en page communes aux fiches en cartes (Contact, Point...) :
// en-tête résumé, colonnes de sections, champs et interrupteurs. Les classes
// (.fiche-*) sont décrites dans FicheLayout.css ; la racine de la fiche porte
// la classe `fiche`.

// En-tête : pastille (initiales, icône), titre, sous-titre, actions à droite.
export function FicheHero({ badge, title, subtitle, actions }: { badge: ReactNode; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <header className="fiche-hero">
      {badge}
      <div className="fiche-hero-text">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      {actions && <div className="fiche-quick">{actions}</div>}
    </header>
  )
}

// Carte titrée ; `aside` s'aligne à droite du titre (ex. un interrupteur).
export function FicheSection({ title, aside, className, children }: { title: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`fiche-section${className ? ` ${className}` : ''}`}>
      <div className="fiche-section-head">
        <h4 className="fiche-section-title">{title}</h4>
        {aside}
      </div>
      {children}
    </section>
  )
}

// Champ libellé ; `wide` occupe toute la ligne de la grille .fiche-grid.
export function FicheField({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`field${wide ? ' fiche-field--wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

// Interrupteur pour les codes 0/1 WinDev (Personne physique, Archivé...).
export function FicheSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="fiche-switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="fiche-switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  )
}

// ---------- Icônes des fiches (trait, héritent de la couleur du texte) ----------

function Icon({ size = 14, children }: { size?: number; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export function BuildingIcon() {
  return <Icon size={20}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4" /></Icon>
}

export function MapPinIcon({ size = 20 }: { size?: number }) {
  return <Icon size={size}><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></Icon>
}

export function MailIcon() {
  return <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>
}

export function PhoneIcon() {
  return (
    <Icon>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </Icon>
  )
}

export function PlusIcon() {
  return <Icon><path d="M12 5v14M5 12h14" /></Icon>
}

export function CloseIcon() {
  return <Icon size={12}><path d="M18 6 6 18M6 6l12 12" /></Icon>
}
