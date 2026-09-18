import { Module } from '@nestjs/common';
import { ChauffeurController } from './chauffeur.controller.js';
import { ChauffeurService } from './chauffeur.service.js';

@Module({
  controllers: [ChauffeurController],
  providers: [ChauffeurService],
})
export class ChauffeurModule {}
