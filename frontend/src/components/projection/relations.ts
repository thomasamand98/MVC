// Projection : sélectionner des lignes d'une table puis afficher, dans un
// nouvel onglet, les enregistrements d'une table liée (ex. 3 sociétés →
// leurs contrats). Ce fichier décrit les tables concernées et leurs liens
// directs ; le filtrage est fait côté serveur (?via=&ids=, voir
// backend/src/common/projection.ts et les *Projections des services).
// Pas d'import de page ici : CrudPage.tsx en dépend, et les pages dépendent
// de CrudPage (voir ProjectionProvider.tsx pour le rendu des onglets).

// Clé d'une table = son endpoint API (GET /societes...), aussi utilisée
// comme valeur de ?via= côté backend.
export type EntityKey =
  | 'societes'
  | 'contrats'
  | 'commandes'
  | 'contacts'
  | 'chauffeurs'
  | 'personnel'
  | 'vehicules'
  | 'attelages'
  | 'pointage'
  | 'points'
  | 'marchandises'

type EntityInfo = {
  // Titre de la table (en-tête, menu Projection, onglet résultat).
  title: string
  // Pluriel en minuscules pour « Contrats de 3 sociétés ».
  plural: string
}

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  societes: { title: 'Sociétés', plural: 'sociétés' },
  contrats: { title: 'Contrats', plural: 'contrats' },
  commandes: { title: 'Commandes', plural: 'commandes' },
  contacts: { title: 'Contacts', plural: 'contacts' },
  chauffeurs: { title: 'Chauffeurs', plural: 'chauffeurs' },
  personnel: { title: 'Personnel', plural: 'membres du personnel' },
  vehicules: { title: 'Véhicules', plural: 'véhicules' },
  attelages: { title: 'Attelages', plural: 'attelages' },
  pointage: { title: 'Pointages', plural: 'pointages' },
  points: { title: 'Points', plural: 'points' },
  marchandises: { title: 'Marchandises', plural: 'marchandises' },
}

export type Relation = {
  target: EntityKey
  // Champ de la fiche cible prérempli avec la ligne d'origine quand la
  // projection part d'une seule ligne (« Nouveau » dans le résultat) —
  // absent quand le lien ne se traduit pas par un champ unique (sens
  // enfant → parent, liens via une table intermédiaire...).
  defaultField?: string
}

// Liens directs proposés par le bouton Projection de chaque table — pour
// aller plus loin, on refait une projection depuis le résultat. Doit
// rester aligné sur les *Projections des services backend.
export const RELATIONS: Record<EntityKey, Relation[]> = {
  societes: [
    { target: 'contrats', defaultField: 'IDSOCIETES' },
    { target: 'contacts', defaultField: 'IDSOCIETES' },
    { target: 'vehicules', defaultField: 'IDSOCIETES' },
    { target: 'chauffeurs', defaultField: 'IDSOCIETES' },
    { target: 'points', defaultField: 'IDSOCIETES' },
  ],
  contrats: [{ target: 'societes' }, { target: 'commandes', defaultField: 'IDCONTRATS' }],
  commandes: [{ target: 'contrats' }, { target: 'marchandises' }],
  contacts: [{ target: 'societes' }, { target: 'points' }],
  chauffeurs: [{ target: 'societes' }, { target: 'personnel' }, { target: 'attelages', defaultField: 'IDCHAUFFEUR' }],
  personnel: [
    { target: 'chauffeurs', defaultField: 'IDPERSONNELS' },
    { target: 'pointage', defaultField: 'IDPERSONNELS' },
    // Attelages de référence : liés au salarié via sa fiche chauffeur, pas
    // de champ à préremplir.
    { target: 'attelages' },
  ],
  vehicules: [{ target: 'societes' }, { target: 'attelages' }],
  attelages: [{ target: 'chauffeurs' }, { target: 'vehicules' }, { target: 'personnel' }],
  pointage: [{ target: 'personnel' }],
  points: [{ target: 'societes' }, { target: 'contacts' }],
  marchandises: [{ target: 'commandes' }],
}

// Ce que reçoit une page ouverte en résultat de projection (voir
// ProjectionProvider.tsx et <Entite>Page.tsx).
export type ProjectionView = {
  source: EntityKey
  ids: string[]
  // En-tête et onglet, ex. « Contrats de 3 sociétés ».
  heading: string
  // Valeurs préremplies du « Nouveau » (projection depuis une seule ligne).
  defaults: Record<string, string>
}

// Filtre envoyé à l'API par useApiList (voir ApiListPagination.filters).
export function projectionFilters(projection: ProjectionView | undefined): Record<string, string> | undefined {
  return projection ? { via: projection.source, ids: projection.ids.join(',') } : undefined
}
