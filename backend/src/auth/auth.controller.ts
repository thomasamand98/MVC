// ===== CONTROLLER =====
// Connexion, renouvellement, déconnexion. Le jeton d'accès est renvoyé dans
// le corps de la réponse (le front le garde en mémoire) ; le jeton de
// renouvellement, lui, n'existe que dans un cookie httpOnly, illisible par
// le JavaScript de la page.
import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { getRefreshCookieOptions, REFRESH_COOKIE, REFRESH_COOKIE_PATH, REFRESH_TTL_SECONDS } from './auth.config.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest, AuthUser } from './auth.types.js';
import { Public } from './public.decorator.js';

const MAX_LOGIN_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 200;

// Tentatives de connexion : bien plus strictes que la limite globale, pour
// freiner le brute force. LOGIN_THROTTLE_LIMIT permet de l'ajuster.
const loginLimit = () => Number(process.env.LOGIN_THROTTLE_LIMIT) || 5;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: loginLimit(), ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { login?: unknown; password?: unknown }, @Res({ passthrough: true }) res: Response) {
    const login = typeof body?.login === 'string' ? body.login.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!login || !password) throw new BadRequestException("Vous devez renseigner l'identifiant et le mot de passe");
    if (login.length > MAX_LOGIN_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      throw new BadRequestException('Identifiant ou mot de passe trop long');
    }

    const user = await this.authService.authenticate(login, password);
    // Même message que l'identifiant existe ou non : on ne révèle rien.
    if (!user) throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
    return this.startSession(user, res);
  }

  // Appelé par le front au chargement de la page et quand le jeton d'accès
  // expire : échange le cookie de renouvellement contre un nouveau jeton
  // d'accès, et prolonge le cookie.
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const token = cookies?.[REFRESH_COOKIE];
    const user = token ? await this.authService.verifyRefreshToken(token) : null;
    if (!user) {
      res.clearCookie(REFRESH_COOKIE, { ...getRefreshCookieOptions(), path: REFRESH_COOKIE_PATH });
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter');
    }
    return this.startSession(user, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, getRefreshCookieOptions());
    return {};
  }

  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return { login: req.user.sub };
  }

  private async startSession(user: AuthUser, res: Response) {
    const [accessToken, refreshToken] = await Promise.all([
      this.authService.issueAccessToken(user),
      this.authService.issueRefreshToken(user),
    ]);
    res.cookie(REFRESH_COOKIE, refreshToken, { ...getRefreshCookieOptions(), maxAge: REFRESH_TTL_SECONDS * 1000 });
    return { accessToken, login: user.sub };
  }
}
