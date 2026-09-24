// Formes manipulées par l'écran Planning, renvoyées par GET /planning
// (backend/src/planning/planning.service.ts) :
//   - PlanningExecution     ← executions de la période
//   - CommandeEnCours       ← commandes datées dans la période
//   - DechargementEnAttente ← executions de déchargement pas encore datées
//   - Chauffeur / Remorque  ← chauffeurs actifs, véhicules utilisés en remorque
// L'API envoie les dates en ISO ; elles sont converties ici en timestamps
// (ms, heure locale) pour simplifier les calculs de position sur la grille.

export type Marchandise = { id: string; nom: string; couleur: string }

export type Chauffeur = {
  id: string
  nom: string
  // Nom de la société sous-traitante, null pour un chauffeur interne.
  sousTraitant: string | null
  // Attelage de référence (AttelageReference), utilisé par défaut quand une
  // commande est déposée sur ce chauffeur.
  remorqueParDefautId: string | null
  tracteurParDefautId: string | null
  tracteurParDefaut: string | null
}

export type Remorque = { id: string; immat: string; type: string }

export type StatutExecution = 'planifie' | 'en_cours' | 'termine'

// `chargement` : chargement dont le déchargement est une exécution liée
// (déchargement différé) ; `dechargement` : cette exécution liée.
export type NatureExecution = 'complete' | 'chargement' | 'dechargement'

export type PlanningExecution = {
  id: string
  commandeId: string | null
  chauffeurId: string | null
  remorqueId: string | null
  tracteur: string | null
  remorqueImmat: string | null
  start: number
  end: number
  client: string
  marchandise: Marchandise
  reference: string | null
  depart: string
  arrivee: string
  statut: StatutExecution
  nature: NatureExecution
  montant: number
  refPlanning: string
  instruction: string | null
}

export type CommandeEnCours = {
  id: string
  numero: string
  date: number | null
  client: string
  marchandise: Marchandise
  reference: string | null
  depart: string
  arrivee: string
  qt: number
  qtPlanifie: number
  // Durée d'une exécution (PrestationRoutier.Duree), en minutes.
  dureeMinutes: number
  prixUnitaire: number
  instruction: string | null
}

export type DechargementEnAttente = {
  id: string
  client: string
  marchandise: Marchandise
  reference: string | null
  depart: string
  arrivee: string
  tracteur: string | null
  remorqueId: string | null
  remorqueImmat: string | null
  chauffeurId: string | null
  dateChargement: number | null
  dureeMinutes: number
  montant: number
}

export type PlanningData = {
  chauffeurs: Chauffeur[]
  remorques: Remorque[]
  executions: PlanningExecution[]
  commandes: CommandeEnCours[]
  dechargements: DechargementEnAttente[]
}

// Réponse brute de l'API : mêmes formes, dates en ISO.
export type ApiExecution = Omit<PlanningExecution, 'start' | 'end'> & { start: string; end: string }
export type ApiPlanning = {
  chauffeurs: Chauffeur[]
  remorques: Remorque[]
  executions: ApiExecution[]
  commandes: (Omit<CommandeEnCours, 'date'> & { date: string | null })[]
  dechargements: (Omit<DechargementEnAttente, 'dateChargement'> & { dateChargement: string | null })[]
}

export type ViewMode = 'colonne' | 'ligne'
export type GroupBy = 'executant' | 'remorque'

// Ligne (mode ligne) ou colonne (mode colonne) du planning.
export type PlanningResource = { id: string; label: string; sublabel: string | null }

// Élément en cours de glisser-déposer. `grabOffsetMinutes` : décalage entre
// le début de la carte et l'endroit où elle a été saisie, pour qu'une carte
// déplacée ne « saute » pas sous le curseur.
export type DragItem = {
  kind: 'commande' | 'dechargement' | 'execution'
  id: string
  durationMinutes: number
  grabOffsetMinutes: number
}

export type DropPreview = { resourceId: string; start: number; end: number }
