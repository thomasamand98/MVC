import type { Request } from 'express';

// Identité portée par un jeton : volontairement réduite à l'identifiant
// (revendication `sub`) — rien d'autre ne circule dans le jeton.
export type AuthUser = { sub: string };

// Requête après passage du guard JwtAuthGuard.
export type AuthenticatedRequest = Request & { user: AuthUser };
