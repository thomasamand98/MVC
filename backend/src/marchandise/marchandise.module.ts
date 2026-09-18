import { Module } from '@nestjs/common';
import { MarchandiseController } from './marchandise.controller.js';
import { MarchandiseService } from './marchandise.service.js';

@Module({
  controllers: [MarchandiseController],
  providers: [MarchandiseService],
})
export class MarchandiseModule {}
