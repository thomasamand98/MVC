import { Module } from '@nestjs/common';
import { PaysController } from './pays.controller.js';
import { PaysService } from './pays.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [PaysController],
  providers: [PaysService, PrismaService],
})
export class PaysModule {}
