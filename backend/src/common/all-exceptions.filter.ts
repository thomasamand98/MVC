// Format d'erreur unique pour toute l'API : { statusCode, message }. Les
// erreurs volontaires (HttpException : 400, 401, 404, 409, 429...) gardent
// leur message ; les erreurs Prisma prévisibles (enregistrement introuvable,
// doublon, référence invalide...) sont traduites en statut et message
// clairs ; toute autre erreur (bug...) est journalisée côté serveur et
// renvoyée au client sans le moindre détail interne.
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

// Codes : https://www.prisma.io/docs/orm/reference/error-reference
const prismaErrors: Record<string, { status: HttpStatus; message: string }> = {
  P2000: { status: HttpStatus.BAD_REQUEST, message: 'Une valeur est trop longue pour son champ.' },
  P2002: { status: HttpStatus.CONFLICT, message: 'Un enregistrement avec cette valeur existe déjà.' },
  P2003: {
    status: HttpStatus.CONFLICT,
    message: 'Opération impossible : un enregistrement lié est introuvable ou encore utilisé ailleurs.',
  },
  P2014: { status: HttpStatus.CONFLICT, message: 'Opération impossible : cet enregistrement est lié à d’autres données.' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Enregistrement introuvable.' },
};

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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const known = prismaErrors[exception.code];
      if (known) {
        // Journalisé en avertissement : utile pour repérer un appel du front
        // qui vise un id disparu ou une contrainte non anticipée.
        this.logger.warn(`${exception.code} ${exception.message.split('\n').pop()}`);
        response.status(known.status).json({ statusCode: known.status, message: known.message });
        return;
      }
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    response.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
}
