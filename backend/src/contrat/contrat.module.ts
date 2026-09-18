import { Module } from '@nestjs/common';
import { ContratController } from './contrat.controller.js';
import { ContratService } from './contrat.service.js';

@Module({
  controllers: [ContratController],
  providers: [ContratService],
})
export class ContratModule {}
