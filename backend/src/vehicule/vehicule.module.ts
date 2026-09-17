import { Module } from '@nestjs/common';
import { VehiculeController } from './vehicule.controller.js';
import { VehiculeService } from './vehicule.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [VehiculeController],
  providers: [VehiculeService, PrismaService],
})
export class VehiculeModule {}
