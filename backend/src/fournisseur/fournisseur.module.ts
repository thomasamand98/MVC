import { Module } from '@nestjs/common';
import { FournisseurController } from './fournisseur.controller.js';
import { FournisseurService } from './fournisseur.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [FournisseurController],
  providers: [FournisseurService, PrismaService],
})
export class FournisseurModule {}
