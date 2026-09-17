import { Module } from '@nestjs/common';
import { CommandeController } from './commande.controller.js';
import { CommandeService } from './commande.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [CommandeController],
  providers: [CommandeService, PrismaService],
})
export class CommandeModule {}
