// Erreur renvoyée par l'API : `message` est celui du serveur (déjà en
// français, ex. « Vous devez renseigner le nom »), affichable tel quel.
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Le backend répond toujours { statusCode, message } en cas d'erreur (voir
// backend/src/common/all-exceptions.filter.ts).
export async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown }
    if (typeof body.message === 'string' && body.message) return body.message
  } catch {
    // Corps absent ou non JSON (ex. réponse d'un proxy) : message générique.
  }
  return `Erreur ${res.status}`
}
