import { Module } from '@nestjs/common';
import { TypeFactureController } from './type-facture.controller.js';
import { TypeFactureService } from './type-facture.service.js';

@Module({
  controllers: [TypeFactureController],
  providers: [TypeFactureService],
})
export class TypeFactureModule {}
