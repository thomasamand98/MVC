// ===== MODEL (logique métier) =====
// Vérification des identifiants et émission/validation des jetons JWT.
// Appelé par AuthController et JwtAuthGuard — jamais par la View directement.
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_AUDIENCE, accessTtlSeconds, REFRESH_AUDIENCE, REFRESH_TTL_SECONDS } from './auth.config.js';
import type { AuthUser } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  // ⚠️ AUTHENTIFICATION FACTICE (temporaire) : accepte n'importe quel couple
  // identifiant / mot de passe, sans consulter la base. Elle ne protège donc
  // rien : quiconque atteint /auth/login obtient un jeton valide. Seul point
  // à remplacer pour une vraie authentification — vérifier le hachage de
  // `utilisateurs.Password_hash` (et `Actif`), puis renvoyer null si les
  // identifiants sont incorrects. Le reste (jetons, guard, front) n'a pas à
  // changer.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async authenticate(login: string, _password: string): Promise<AuthUser | null> {
    return { sub: login };
  }

  async issueAccessToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync({}, { subject: user.sub, audience: ACCESS_AUDIENCE, expiresIn: accessTtlSeconds() });
  }

  async issueRefreshToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync({}, { subject: user.sub, audience: REFRESH_AUDIENCE, expiresIn: REFRESH_TTL_SECONDS });
  }

  // Renvoie l'identité si le jeton est valide (signature, expiration,
  // émetteur, audience), sinon null.
  verifyAccessToken(token: string): Promise<AuthUser | null> {
    return this.verify(token, ACCESS_AUDIENCE);
  }

  verifyRefreshToken(token: string): Promise<AuthUser | null> {
    return this.verify(token, REFRESH_AUDIENCE);
  }

  private async verify(token: string, audience: string): Promise<AuthUser | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token, { audience });
      return typeof payload.sub === 'string' && payload.sub ? { sub: payload.sub } : null;
    } catch {
      return null;
    }
  }
}
