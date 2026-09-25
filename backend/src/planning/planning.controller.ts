// ===== CONTROLLER =====
// Reçoit les requêtes HTTP de l'écran Planning et délègue au Model
// (PlanningService).
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PlanningService } from './planning.service.js';
import { CreatePlanningExecutionDto, MovePlanningExecutionDto } from './planning.dto.js';
import { ZodBodyPipe } from '../common/validation.js';

@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  // ?from=<ISO>&to=<ISO> : bornes de la période (to exclu), en instants —
  // pour les exécutions (colonnes TIMESTAMP).
  // ?jourDebut=YYYY-MM-DD&jourFin=YYYY-MM-DD : mêmes jours, inclus — pour
  // les commandes (colonne DATE, sans fuseau horaire).
  @Get()
  async getPlanning(@Query('from') from: string, @Query('to') to: string, @Query('jourDebut') jourDebut: string, @Query('jourFin') jourFin: string) {
    return this.planningService.getPlanning(from, to, jourDebut, jourFin);
  }

  @Post('executions')
  async createExecution(@Body(new ZodBodyPipe(CreatePlanningExecutionDto)) dto: CreatePlanningExecutionDto) {
    return this.planningService.createExecution(dto);
  }

  @Patch('executions/:id')
  async moveExecution(@Param('id') id: string, @Body(new ZodBodyPipe(MovePlanningExecutionDto)) dto: MovePlanningExecutionDto) {
    return this.planningService.moveExecution(id, dto);
  }

  @Delete('executions/:id')
  async deleteExecution(@Param('id') id: string) {
    await this.planningService.deleteExecution(id);
  }
}
