import { Module } from '@nestjs/common';
import { EntiteController } from './entite.controller.js';
import { EntiteService } from './entite.service.js';

@Module({
  controllers: [EntiteController],
  providers: [EntiteService],
})
export class EntiteModule {}
