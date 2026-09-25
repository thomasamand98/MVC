// Numéro affiché d'un contrat : numéro + version (« 1680.24/07 »), comme
// dans l'ancienne application. « 0 » est la version par défaut de la base,
// pour un contrat jamais versionné.
export function formatNumContrat(contrat: { Num_contrat: string | null; Version_contrat?: string | null }): string {
  const numero = contrat.Num_contrat ?? ''
  return contrat.Version_contrat && contrat.Version_contrat !== '0' ? `${numero}.${contrat.Version_contrat}` : numero
}
