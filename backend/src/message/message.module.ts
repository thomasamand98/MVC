import { Module } from '@nestjs/common';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [MessageController],
  providers: [MessageService, PrismaService],
})
export class MessageModule {}
