import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { PresupuestosService } from './presupuestos.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { CreateGastoDto, UpdateGastoDto } from './dto/create-gasto.dto';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('presupuestos')
@UseGuards(FirebaseAuthGuard)
export class PresupuestosController {
  constructor(private readonly service: PresupuestosService) {}

  @Post() create(@Body() dto: CreatePresupuestoDto, @Req() req: Request) { return this.service.create(dto, req.user as FirebaseUser); }
  @Get() findAll(@Req() req: Request) { return this.service.findAll(req.user as FirebaseUser); }
  @Get(':id') async findOne(@Param('id') id: string) { const p = await this.service.findOne(id); if (!p) throw new NotFoundException('No encontrado'); return p; }
  @Post(':id/gastos') addGasto(@Param('id') id: string, @Body() dto: CreateGastoDto, @Req() req: Request) { return this.service.addGasto(id, dto, req.user as FirebaseUser); }
  @Patch(':id/gastos/:gastoId') updateGasto(@Param('id') id: string, @Param('gastoId') gastoId: string, @Body() dto: UpdateGastoDto) { return this.service.updateGasto(id, gastoId, dto); }
  @Delete(':id/gastos/:gastoId') deleteGasto(@Param('id') id: string, @Param('gastoId') gastoId: string) { return this.service.deleteGasto(id, gastoId); }
  @Delete(':id') delete(@Param('id') id: string) { return this.service.delete(id); }
}
