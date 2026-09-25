// Adresse aplatie, mêmes clés que la table `adresses` (voir les DTO Contact
// et Point côté backend, qui l'enregistrent à part). Saisie avec
// components/AdresseFields.tsx.
export type AdresseValues = {
  Adresse1: string
  Adresse2: string
  Adresse3: string
  CP: string
  Localite: string
  Pays: string
  Pays_full_name: string
}

const ADRESSE_KEYS = ['Adresse1', 'Adresse2', 'Adresse3', 'CP', 'Localite', 'Pays', 'Pays_full_name'] as const

// Valeurs du formulaire depuis l'adresse renvoyée par l'API (null → vide).
export function adresseValues(adresse: Partial<Record<keyof AdresseValues, string | null>> | null | undefined): AdresseValues {
  return Object.fromEntries(ADRESSE_KEYS.map((key) => [key, adresse?.[key] ?? ''])) as AdresseValues
}

// Une ligne lisible : « Rue…, 2030 ANTWERPEN, BELGIQUE ».
export function formatAdresse(a: Partial<Record<keyof AdresseValues, string | null>>): string {
  const ville = [a.CP, a.Localite].filter((v) => v?.trim()).join(' ')
  return [a.Adresse1, ville, a.Pays_full_name].filter((v) => v?.trim()).join(', ')
}
