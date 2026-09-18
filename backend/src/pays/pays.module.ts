import { Module } from '@nestjs/common';
import { PaysController } from './pays.controller.js';
import { PaysService } from './pays.service.js';

@Module({
  controllers: [PaysController],
  providers: [PaysService],
})
export class PaysModule {}
