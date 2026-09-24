// Le reste de l'app lit process.env directement (voir auth.config.ts,
// main.ts) plutôt que le module @nestjs/config — qui n'est enregistré nulle
// part ici. L'ancienne version de ce module injectait ConfigService sans
// que ConfigModule soit jamais importé : une dépendance impossible à
// résoudre au démarrage (et le module n'était de toute façon importé nulle
// part dans app.module.ts).
import { Module } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { MistralController } from './mistral.controller.js';
import { MistralService } from './mistral.service.js';

@Module({
  controllers: [MistralController],
  providers: [
    {
      provide: 'MISTRAL_CLIENT',
      useFactory: () => new Mistral({ apiKey: process.env.MISTRAL_API_KEY }),
    },
    MistralService,
  ],
  exports: [MistralService],
})
export class MistralModule {}