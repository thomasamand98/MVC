// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (ContactService).
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import type { CreateContactDto, UpdateContactDto } from './contact.dto.js';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get('contacts')
  async getContacts() {
    const contacts = await this.contactService.getContacts();
    return { contacts };
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
