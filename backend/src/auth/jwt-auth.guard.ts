// Guard global : toute route exige un jeton d'accès valide dans l'en-tête
// `Authorization: Bearer <jeton>`, sauf celles marquées @Public().
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { IS_PUBLIC } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    const user = type === 'Bearer' && token ? await this.authService.verifyAccessToken(token) : null;
    if (!user) throw new UnauthorizedException('Session expirée ou invalide, veuillez vous reconnecter');

    request.user = user;
    return true;
  }
}
