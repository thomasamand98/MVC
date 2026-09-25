// Un champ vidé dans un formulaire arrive en '' : Prisma l'accepte pour un
// texte, mais le refuse pour une date ou un décimal (erreur 500). Convertit
// les champs indiqués en null, pour vider la colonne en base.
export function blankToNull<T extends object, K extends keyof T>(dto: T, keys: readonly K[]): Omit<T, K> & { [P in K]?: T[P] | null } {
  const result = { ...dto } as Record<string, unknown>;
  for (const key of keys) {
    if (result[key as string] === '') result[key as string] = null;
  }
  return result as Omit<T, K> & { [P in K]?: T[P] | null };
}

// Identifiant de clé étrangère reçu en texte (voir `id`, validation.ts) :
// absent = champ inchangé, '' = lien retiré (NULL — 0, le défaut WinDev,
// violerait la clé étrangère), sinon l'id en BigInt.
export function toOptionalId(value: string | undefined): bigint | null | undefined {
  if (value === undefined) return undefined;
  return value ? BigInt(value) : null;
}
