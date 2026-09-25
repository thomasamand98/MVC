// Suivi des saisies non enregistrées, commun à toute l'application.
//
// Chaque saisie modifiable (fiche, éditeur...) déclare un « garde »
// (LeaveGuard) dans la zone (GuardScope) où elle est affichée. Les zones
// s'imbriquent comme l'interface : application > onglet > fiche > sous-fiche.
// Quitter une zone (fermer une fiche, un onglet, se déconnecter...) demande
// d'abord quoi faire des gardes modifiés qu'elle contient, à n'importe quelle
// profondeur — voir UnsavedChangesProvider pour le dialogue.

export type LeaveGuard = {
  isDirty: () => boolean
  // Enregistre la saisie. Réussi si, une fois terminé, le garde n'est plus
  // modifié ou a disparu (fiche refermée après enregistrement) ; sinon
  // l'enregistrement a échoué et la saisie reste affichée.
  save: () => Promise<unknown> | void
  // Contrôle navigateur (champs requis, formats) avant d'enregistrer.
  validate: () => boolean
  // Modifications abandonnées : le garde ne bloque plus la sortie.
  release: () => void
}

export class GuardScope {
  readonly guards = new Set<LeaveGuard>()
  readonly children = new Set<GuardScope>()
  readonly parent: GuardScope | null

  constructor(parent: GuardScope | null) {
    this.parent = parent
  }

  // Rattachement au parent au montage (et non à la construction) pour
  // supporter le double montage de React en mode strict.
  attach() {
    this.parent?.children.add(this)
  }

  detach() {
    this.parent?.children.delete(this)
  }

  dirtyGuards(): LeaveGuard[] {
    return [
      ...[...this.guards].filter((guard) => guard.isDirty()),
      ...[...this.children].flatMap((child) => child.dirtyGuards()),
    ]
  }
}

// Cible d'une demande de sortie : une zone entière, ou des gardes précis
// (ex. le bouton Annuler d'une fiche ne concerne que cette fiche).
export type LeaveTarget = GuardScope | LeaveGuard[]

export function dirtyGuardsOf(target: LeaveTarget): LeaveGuard[] {
  return Array.isArray(target) ? target.filter((guard) => guard.isDirty()) : target.dirtyGuards()
}
