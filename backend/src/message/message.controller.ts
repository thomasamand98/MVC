// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (MessageService).
import { Controller, Get, Query } from '@nestjs/common';
import { MessageService } from './message.service.js';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // ?societeId=X (obligatoire) : liste des messages envoyés liés à cette
  // société — voir MessageService.getMessagesBySociete.
  @Get('messages')
  async getMessages(@Query('societeId') societeId: string) {
    return this.messageService.getMessagesBySociete(BigInt(societeId));
  }
}
