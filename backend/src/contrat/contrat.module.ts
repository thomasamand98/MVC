import { Module } from '@nestjs/common';
import { ContratController } from './contrat.controller.js';
import { ContratService } from './contrat.service.js';
import { EnumerationModule } from '../enumeration/enumeration.module.js';
import { EntiteModule } from '../entite/entite.module.js';
import { DocumentMergeModule } from '../document-merge/document-merge.module.js';

@Module({
  imports: [EnumerationModule, EntiteModule, DocumentMergeModule],
  controllers: [ContratController],
  providers: [ContratService],
})
export class ContratModule {}
