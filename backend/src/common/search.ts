// Recherche globale des tableaux (champ « Rechercher » de CrudPage.tsx,
// envoyé en ?search=...) : chaque mot saisi doit apparaître dans au moins
// une des colonnes texte listées par le service — « dupont 06 » trouve une
// ligne dont le nom contient « dupont » ET un téléphone contenant « 06 ».
// Pas besoin de mode insensible à la casse : la collation MySQL
// utf8mb4_unicode_ci ignore déjà la casse et les accents.
export type Contains = { contains: string };

export function buildSearchWhere<TWhere>(
  search: string | undefined,
  fields: (contains: Contains) => TWhere[],
): { AND: { OR: TWhere[] }[] } | undefined {
  const terms = search?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (terms.length === 0) return undefined;
  return { AND: terms.map((term) => ({ OR: fields({ contains: term }) })) };
}
