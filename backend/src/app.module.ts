// Module racine de l'application NestJS.
// Il n'a pas de logique propre : il assemble les modules métier
// qui, eux, regroupent Controller + Service + accès Model.
// Pour ajouter une nouvelle fonctionnalité, on créerait un nouveau module
// et on l'ajouterait dans le tableau `imports` ci-dessous.
import { Module } from '@nestjs/common';
import { SocieteModule } from './societe/societe.module.js';
import { ContratModule } from './contrat/contrat.module.js';
import { ContactModule } from './contact/contact.module.js';
import { PointModule } from './point/point.module.js';
import { ConditionModule } from './condition/condition.module.js';
import { MarchandiseModule } from './marchandise/marchandise.module.js';

@Module({
  imports: [SocieteModule, ContratModule, ContactModule, PointModule, ConditionModule, MarchandiseModule],
})
export class AppModule {}
