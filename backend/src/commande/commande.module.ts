import { Module } from '@nestjs/common';
import { CommandeController } from './commande.controller.js';
import { CommandeService } from './commande.service.js';

@Module({
  controllers: [CommandeController],
  providers: [CommandeService],
})
export class CommandeModule {}
