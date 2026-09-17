import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller.js';
import { PersonnelService } from './personnel.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [PersonnelController],
  providers: [PersonnelService, PrismaService],
})
export class PersonnelModule {}
