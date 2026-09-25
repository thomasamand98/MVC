// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PersonnelService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PersonnelService } from './personnel.service.js';
import { CreatePersonnelDto, UpdatePersonnelDto } from './personnel.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir PersonnelService.getPersonnels pour le détail.
  @Get('personnel')
  async getPersonnels(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.personnelService.getPersonnels(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  @Get('personnel/:id')
  async getPersonnel(@Param('id', ParseIdPipe) id: bigint) {
    return this.personnelService.getPersonnel(id);
  }

  @Post('personnel')
  async createPersonnel(@Body(new ZodBodyPipe(CreatePersonnelDto)) dto: CreatePersonnelDto) {
    return this.personnelService.createPersonnel(dto);
  }

  @Patch('personnel/:id')
  async updatePersonnel(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdatePersonnelDto)) dto: UpdatePersonnelDto) {
    return this.personnelService.updatePersonnel(id, dto);
  }

  @Delete('personnel/:id')
  async deletePersonnel(@Param('id', ParseIdPipe) id: bigint) {
    await this.personnelService.deletePersonnel(id);
  }
}
