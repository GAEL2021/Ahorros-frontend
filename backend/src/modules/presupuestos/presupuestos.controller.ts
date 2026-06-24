import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Req, NotFoundException, BadRequestException } from '@nestjs/common';
import { PresupuestosService } from './presupuestos.service';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto';
import { UpdatePresupuestoDto } from './dto/update-presupuesto.dto';
import { CreateGastoDto, UpdateGastoDto, UpdateGastoFechaDto, PagarGastoDto } from './dto/create-gasto.dto';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('presupuestos')
@UseGuards(FirebaseAuthGuard)
export class PresupuestosController {
  constructor(private readonly service: PresupuestosService) {}

  @Post() create(@Body() dto: CreatePresupuestoDto, @Req() req: Request) { return this.service.create(dto, req.user as FirebaseUser); }
  @Get() findAll(@Req() req: Request) { return this.service.findAll(req.user as FirebaseUser); }
  @Get('controles') findControles(@Req() req: Request) { return this.service.findControles(req.user as FirebaseUser); }
  @Get(':id') async findOne(@Param('id') id: string) { const p = await this.service.findOne(id); if (!p) throw new NotFoundException('No encontrado'); return p; }
  @Patch(':id') async update(@Param('id') id: string, @Body() dto: UpdatePresupuestoDto) { try { return await this.service.updatePresupuesto(id, dto); } catch (e: any) { if (e instanceof NotFoundException) throw e; throw new BadRequestException(e.message); } }
  @Post(':id/gastos') addGasto(@Param('id') id: string, @Body() dto: CreateGastoDto, @Req() req: Request) { return this.service.addGasto(id, dto, req.user as FirebaseUser); }
  @Post(':id/cerrar-mes') async cerrarMes(@Param('id') id: string, @Body() body: { quincena?: 'Q1' | 'Q2' }, @Req() req: Request) { try { return await this.service.cerrarMes(id, (req.user as FirebaseUser)?.uid, body.quincena); } catch (e: any) { throw new BadRequestException(e.message); } }
  @Post(':id/carry-to-new-year') async carryToNewYear(@Param('id') id: string, @Req() req: Request) { try { return await this.service.carryToNewYear(id, req.user as FirebaseUser); } catch (e: any) { throw new BadRequestException(e.message); } }
  @Patch(':id/gastos/:gastoId') updateGasto(@Param('id') id: string, @Param('gastoId') gastoId: string, @Body() dto: UpdateGastoDto) { return this.service.updateGasto(id, gastoId, dto); }
  @Patch(':id/gastos/:gastoId/fecha') updateGastoFecha(@Param('id') id: string, @Param('gastoId') gastoId: string, @Body() dto: UpdateGastoFechaDto) { return this.service.updateGastoFecha(id, gastoId, dto.fecha); }
  @Post(':id/gastos/:gastoId/pagar') async pagarGasto(@Param('id') id: string, @Param('gastoId') gastoId: string, @Body() dto: PagarGastoDto, @Req() req: Request) { try { return await this.service.pagarGasto(id, gastoId, req.user as FirebaseUser, dto.montoReal, dto.carteraId, (dto as any).medioDePago, (dto as any).tarjetaCreditoId); } catch (e: any) { throw new BadRequestException(e.message); } }
  @Delete(':id/gastos/:gastoId') deleteGasto(@Param('id') id: string, @Param('gastoId') gastoId: string) { return this.service.deleteGasto(id, gastoId); }
  @Delete(':id') delete(@Param('id') id: string) { return this.service.delete(id); }
  @Delete('controles/:controlId') async deleteControl(@Param('controlId') controlId: string, @Req() req: Request) { try { return await this.service.deleteControl(controlId, req.user as FirebaseUser); } catch (e: any) { throw new BadRequestException(e.message); } }
}