import { Module } from '@nestjs/common';
import { ContratTravailController } from './contrat-travail.controller.js';
import { ContratTravailService } from './contrat-travail.service.js';

@Module({
  controllers: [ContratTravailController],
  providers: [ContratTravailService],
})
export class ContratTravailModule {}
