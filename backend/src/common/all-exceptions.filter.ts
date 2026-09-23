// Format d'erreur unique pour toute l'API : { statusCode, message }. Les
// erreurs volontaires (HttpException : 400, 401, 404, 409, 429...) gardent
// leur message ; toute autre erreur (bug, erreur Prisma...) est journalisée
// côté serveur et renvoyée au client sans le moindre détail interne.
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join(', ') : (raw ?? exception.message);
      response.status(status).json({ statusCode: status, message });
      return;
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    response.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
}
