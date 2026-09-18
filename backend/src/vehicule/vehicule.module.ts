import { Module } from '@nestjs/common';
import { VehiculeController } from './vehicule.controller.js';
import { VehiculeService } from './vehicule.service.js';

@Module({
  controllers: [VehiculeController],
  providers: [VehiculeService],
})
export class VehiculeModule {}
