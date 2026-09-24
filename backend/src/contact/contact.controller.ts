// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContactService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import type { CreateContactDto, UpdateContactDto } from './contact.dto.js';
import { parseProjection } from '../common/projection.js';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir ContactService.getContacts pour le détail.
  @Get('contacts')
  async getContacts(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('societeId') societeId?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.contactService.getContacts(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined, search, societeId, parseProjection(via, ids));
  }

  @Get('contacts/:id')
  async getContact(@Param('id') id: string) {
    return this.contactService.getContact(BigInt(id));
  }

  @Post('contacts')
  async createContact(@Body() dto: CreateContactDto) {
    return this.contactService.createContact(dto);
  }

  @Patch('contacts/:id')
  async updateContact(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactService.updateContact(BigInt(id), dto);
  }

  @Delete('contacts/:id')
  async deleteContact(@Param('id') id: string) {
    await this.contactService.deleteContact(BigInt(id));
  }
}
