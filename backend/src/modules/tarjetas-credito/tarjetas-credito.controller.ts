import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Req, NotFoundException, BadRequestException } from '@nestjs/common';
import { TarjetasCreditoService } from './tarjetas-credito.service';
import { CreateTarjetaCreditoDto } from './dto/create-tarjeta-credito.dto';
import { UpdateTarjetaCreditoDto } from './dto/update-tarjeta-credito.dto';
import { PagarTarjetaDto } from './dto/pagar-tarjeta.dto';
import { SimularPagoDto } from './dto/simular-pago.dto';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('tarjetas-credito')
@UseGuards(FirebaseAuthGuard)
export class TarjetasCreditoController {
  constructor(private readonly service: TarjetasCreditoService) {}

  @Post()
  create(@Body() dto: CreateTarjetaCreditoDto, @Req() req: Request) {
    return this.service.create(dto, req.user as FirebaseUser);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req.user as FirebaseUser);
  }

  @Get('resumen')
  getResumen(@Req() req: Request) {
    return this.service.getResumen(req.user as FirebaseUser);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try { return await this.service.findOne(id, req.user as FirebaseUser); }
    catch (e: any) { if (e instanceof NotFoundException) throw e; throw new BadRequestException(e.message); }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTarjetaCreditoDto, @Req() req: Request) {
    return this.service.update(id, dto, req.user as FirebaseUser);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.service.delete(id, req.user as FirebaseUser);
  }

  @Post(':id/pagar')
  pagar(@Param('id') id: string, @Body() dto: PagarTarjetaDto, @Req() req: Request) {
    return this.service.pagarTarjeta(id, dto, req.user as FirebaseUser);
  }

  @Get(':id/dashboard')
  getDashboard(@Param('id') id: string, @Req() req: Request) {
    return this.service.getDashboard(id, req.user as FirebaseUser);
  }

  @Get(':id/capacidad-pago')
  getCapacidadPago(@Param('id') id: string, @Req() req: Request) {
    return this.service.getCapacidadPago(id, req.user as FirebaseUser);
  }

  @Post(':id/simular')
  simular(@Param('id') id: string, @Body() dto: SimularPagoDto, @Req() req: Request) {
    return this.service.simularPago(id, dto, req.user as FirebaseUser);
  }

  @Get(':id/ciclo-actual')
  getCicloActual(@Param('id') id: string, @Req() req: Request) {
    return this.service.getCicloActual(id, req.user as FirebaseUser);
  }
}
