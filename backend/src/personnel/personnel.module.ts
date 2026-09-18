import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller.js';
import { PersonnelService } from './personnel.service.js';

@Module({
  controllers: [PersonnelController],
  providers: [PersonnelService],
})
export class PersonnelModule {}
