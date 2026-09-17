import {
  tableFeatures,
  rowSortingFeature,
  createSortedRowModel,
  sortFn_text,
  columnFilteringFeature,
  createFilteredRowModel,
  filterFn_includesString,
} from '@tanstack/react-table'

// TanStack Table v9 : aucune fonctionnalité n'est active par défaut,
// il faut déclarer explicitement celles utilisées par ce tableau.
// Ici : tri (rowSortingFeature) + filtre par colonne (columnFilteringFeature).
// Partagé par toutes les features sous src/features/ — identique pour
// chaque tableau, donc factorisé ici plutôt que dupliqué par feature.
export const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
})
