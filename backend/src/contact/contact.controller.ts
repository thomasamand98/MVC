// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContactService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { CreateContactDto, UpdateContactDto } from './contact.dto.js';
import { parseProjection } from '../common/projection.js';
import { OptionalIdPipe, ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir ContactService.getContacts pour le détail.
  @Get('contacts')
  async getContacts(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('societeId', OptionalIdPipe) societeId?: bigint, @Query('via') via?: string, @Query('ids') ids?: string, @Query('pointId', OptionalIdPipe) pointId?: bigint) {
    return this.contactService.getContacts(parsePage(page), parsePageSize(pageSize), search, societeId, parseProjection(via, ids), pointId);
  }

  @Get('contacts/:id')
  async getContact(@Param('id', ParseIdPipe) id: bigint) {
    return this.contactService.getContact(id);
  }

  @Post('contacts')
  async createContact(@Body(new ZodBodyPipe(CreateContactDto)) dto: CreateContactDto) {
    return this.contactService.createContact(dto);
  }

  @Patch('contacts/:id')
  async updateContact(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdateContactDto)) dto: UpdateContactDto) {
    return this.contactService.updateContact(id, dto);
  }

  @Delete('contacts/:id')
  async deleteContact(@Param('id', ParseIdPipe) id: bigint) {
    await this.contactService.deleteContact(id);
  }
}
