import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JoinGoalDto } from './dto/join-goal.dto';
import { ContribuirDto } from './dto/contribuir.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('goals')
@UseGuards(FirebaseAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Body() dto: CreateGoalDto, @Req() req: Request) {
    return this.goalsService.createGoal(dto, req.user as FirebaseUser);
  }

  @Get()
  getUserGoals(@Req() req: Request) {
    return this.goalsService.getUserGoals(req.user as FirebaseUser);
  }

  @Post('join-by-code')
  joinByCode(@Body() dto: JoinGoalDto, @Req() req: Request) {
    return this.goalsService.joinGoalByCode(dto.codigo, req.user as FirebaseUser);
  }

  @Get(':id')
  async getGoalById(@Param('id') id: string) {
    const goal = await this.goalsService.getGoalById(id);
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return goal;
  }

  @Patch(':id')
  updateGoal(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @Req() req: Request,
  ) {
    return this.goalsService.updateGoal(id, dto, req.user as FirebaseUser);
  }

  @Delete(':id')
  deleteGoal(@Param('id') id: string, @Req() req: Request) {
    return this.goalsService.deleteGoal(id, req.user as FirebaseUser);
  }

  @Post(':id/contribuir')
  contribute(
    @Param('id') id: string,
    @Body() dto: ContribuirDto,
    @Req() req: Request,
  ) {
    return this.goalsService.contributeToGoal(id, dto, req.user as FirebaseUser);
  }

  @Get(':id/control_cuotas')
  async getControlCuotas(@Param('id') id: string) {
    const cuotas = await this.goalsService.getGoalControlCuotas(id);
    if (cuotas === null) throw new NotFoundException('Meta no encontrada');
    return cuotas;
  }

  @Get(':id/checklist')
  async getChecklist(@Param('id') id: string) {
    const items = await this.goalsService.getGoalChecklist(id);
    if (items === null) throw new NotFoundException('Meta no encontrada');
    return items;
  }

  @Post(':id/checklist')
  addChecklistItem(
    @Param('id') id: string,
    @Body() dto: CreateChecklistItemDto,
    @Req() req: Request,
  ) {
    return this.goalsService.addChecklistItem(id, dto.texto, dto.monto ?? 0, req.user as FirebaseUser, dto.ignorarExceso ?? false);
  }

  @Patch(':id/checklist/:itemId')
  updateChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @Req() req: Request,
  ) {
    return this.goalsService.updateChecklistItem(id, itemId, dto, req.user as FirebaseUser);
  }

  @Delete(':id/checklist/:itemId')
  deleteChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.goalsService.deleteChecklistItem(id, itemId);
  }
}
