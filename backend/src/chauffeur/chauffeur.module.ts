import { Module } from '@nestjs/common';
import { ChauffeurController } from './chauffeur.controller.js';
import { ChauffeurService } from './chauffeur.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [ChauffeurController],
  providers: [ChauffeurService, PrismaService],
})
export class ChauffeurModule {}
