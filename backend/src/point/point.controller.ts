// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de la View et délègue au Model (PointService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PointService } from './point.service.js';
import { CreatePointDto, UpdatePointContactDto, UpdatePointDto } from './point.dto.js';
import { parseProjection } from '../common/projection.js';
import { ParseIdPipe, parsePage, parsePageSize } from '../common/params.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller()
export class PointController {
  constructor(private readonly pointService: PointService) {}

  // ?page=1&pageSize=25 : optionnels — omis, renvoie toute la table (comme
  // avant). Voir PointService.getPoints pour le détail.
  @Get('points')
  async getPoints(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string, @Query('via') via?: string, @Query('ids') ids?: string) {
    return this.pointService.getPoints(parsePage(page), parsePageSize(pageSize), search, parseProjection(via, ids));
  }

  @Get('points/:id')
  async getPoint(@Param('id', ParseIdPipe) id: bigint) {
    return this.pointService.getPoint(id);
  }

  @Post('points')
  async createPoint(@Body(new ZodBodyPipe(CreatePointDto)) dto: CreatePointDto) {
    return this.pointService.createPoint(dto);
  }

  @Patch('points/:id')
  async updatePoint(@Param('id', ParseIdPipe) id: bigint, @Body(new ZodBodyPipe(UpdatePointDto)) dto: UpdatePointDto) {
    return this.pointService.updatePoint(id, dto);
  }

  @Delete('points/:id')
  async deletePoint(@Param('id', ParseIdPipe) id: bigint) {
    await this.pointService.deletePoint(id);
  }

  // Lien d'un contact avec le point (onglet Contacts de la fiche Point).
  @Patch('points/:id/contacts/:contactId')
  async updatePointContact(
    @Param('id', ParseIdPipe) id: bigint,
    @Param('contactId', ParseIdPipe) contactId: bigint,
    @Body(new ZodBodyPipe(UpdatePointContactDto)) dto: UpdatePointContactDto,
  ) {
    await this.pointService.updatePointContact(id, contactId, dto);
  }

  // Retire le contact du point — le contact lui-même est conservé.
  @Delete('points/:id/contacts/:contactId')
  async removePointContact(@Param('id', ParseIdPipe) id: bigint, @Param('contactId', ParseIdPipe) contactId: bigint) {
    await this.pointService.removePointContact(id, contactId);
  }
}
