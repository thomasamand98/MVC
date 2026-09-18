import { Module } from '@nestjs/common';
import { VilleController } from './ville.controller.js';
import { VilleService } from './ville.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [VilleController],
  providers: [VilleService, PrismaService],
})
export class VilleModule {}
