// Convertit récursivement tous les BigInt d'une valeur (renvoyée par Prisma)
// en string, pour que JSON.stringify (utilisé par Nest pour la réponse HTTP)
// ne plante pas dessus. Les Date, null et autres objets non "plain" (ex.
// Prisma.Decimal) traversent inchangés — seuls les objets/tableaux simples
// sont parcourus.
export type SerializeBigInt<T> = T extends bigint
  ? string
  : T extends Date
    ? T
    : T extends (infer U)[]
      ? SerializeBigInt<U>[]
      : T extends object
        ? { [K in keyof T]: SerializeBigInt<T[K]> }
        : T;

export function serializeBigInt<T>(value: T): SerializeBigInt<T> {
  if (typeof value === 'bigint') {
    return value.toString() as SerializeBigInt<T>;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item)) as SerializeBigInt<T>;
  }
  if (value !== null && typeof value === 'object' && value.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeBigInt(val);
    }
    return result as SerializeBigInt<T>;
  }
  return value as SerializeBigInt<T>;
}
