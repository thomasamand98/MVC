import { Module } from '@nestjs/common';
import { VilleController } from './ville.controller.js';
import { VilleService } from './ville.service.js';

@Module({
  controllers: [VilleController],
  providers: [VilleService],
})
export class VilleModule {}
