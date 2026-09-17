// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PersonnelService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PersonnelService } from './personnel.service.js';
import type { CreatePersonnelDto, UpdatePersonnelDto } from './personnel.dto.js';

@Controller()
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir PersonnelService.getPersonnels pour le détail.
  @Get('personnel')
  async getPersonnels(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.personnelService.getPersonnels(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get('personnel/:id')
  async getPersonnel(@Param('id') id: string) {
    return this.personnelService.getPersonnel(BigInt(id));
  }

  @Post('personnel')
  async createPersonnel(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.createPersonnel(dto);
  }

  @Patch('personnel/:id')
  async updatePersonnel(@Param('id') id: string, @Body() dto: UpdatePersonnelDto) {
    return this.personnelService.updatePersonnel(BigInt(id), dto);
  }

  @Delete('personnel/:id')
  async deletePersonnel(@Param('id') id: string) {
    await this.personnelService.deletePersonnel(BigInt(id));
  }
}
