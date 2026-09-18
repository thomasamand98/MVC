// ===== MODEL (logique métier) =====
// Liste de référence utilisée pour peupler les sélecteurs "Client" (ex.
// IDCLIENTS de SocieteForm.tsx) — même rôle que PaysService : une table
// courte, chargée en une fois plutôt que paginée.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeBigInt } from '../prisma/serialize-bigint.js';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async getClients() {
    const clients = await this.prisma.client.findMany({
      orderBy: { IDCLIENTS: 'asc' },
      select: { IDCLIENTS: true, Numero_client: true },
    });
    return { clients: serializeBigInt(clients) };
  }
}
