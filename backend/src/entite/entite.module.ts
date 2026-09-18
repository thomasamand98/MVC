import { Module } from '@nestjs/common';
import { EntiteController } from './entite.controller.js';
import { EntiteService } from './entite.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [EntiteController],
  providers: [EntiteService, PrismaService],
})
export class EntiteModule {}
