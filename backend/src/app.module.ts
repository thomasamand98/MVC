// Module racine de l'application NestJS.
// Il n'a pas de logique propre : il assemble les modules métier
// (ici HelloModule) qui, eux, regroupent Controller + Service + accès Model.
// Pour ajouter une nouvelle fonctionnalité, on créerait un nouveau module
// et on l'ajouterait dans le tableau `imports` ci-dessous.
import { Module } from '@nestjs/common';
import { HelloModule } from './hello/hello.module.js';

@Module({
  imports: [HelloModule],
})
export class AppModule {}
