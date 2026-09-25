import { Module } from '@nestjs/common';
import { DechetController } from './dechet.controller.js';
import { DechetService } from './dechet.service.js';

@Module({
  controllers: [DechetController],
  providers: [DechetService],
})
export class DechetModule {}
