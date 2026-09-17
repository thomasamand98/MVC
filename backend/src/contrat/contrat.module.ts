import { Module } from '@nestjs/common';
import { ContratController } from './contrat.controller.js';
import { ContratService } from './contrat.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [ContratController],
  providers: [ContratService, PrismaService],
})
export class ContratModule {}
