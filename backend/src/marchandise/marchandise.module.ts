import { Module } from '@nestjs/common';
import { MarchandiseController } from './marchandise.controller.js';
import { MarchandiseService } from './marchandise.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [MarchandiseController],
  providers: [MarchandiseService, PrismaService],
})
export class MarchandiseModule {}
