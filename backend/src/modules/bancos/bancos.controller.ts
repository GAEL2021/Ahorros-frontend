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
} from '@nestjs/common';
import { BancosService } from './bancos.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';
import { AdminUpdateBancoDto } from './dto/admin-update-banco.dto';
import { DepositarDto } from './dto/depositar.dto';
import { RetirarDto } from './dto/retirar.dto';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Request } from 'express';

@Controller('bancos')
@UseGuards(FirebaseAuthGuard)
export class BancosController {
  constructor(private readonly bancosService: BancosService) {}

  @Post()
  create(@Body() dto: CreateBancoDto, @Req() req: Request) {
    return this.bancosService.createBanco(dto, req.user as FirebaseUser);
  }

  @Get()
  getUserBancos(@Req() req: Request) {
    return this.bancosService.getUserBancos(req.user as FirebaseUser);
  }

  @Post('join-by-code')
  joinByCode(@Body('codigo') codigo: string, @Req() req: Request) {
    return this.bancosService.joinBancoByCode(codigo, req.user as FirebaseUser);
  }

  @Get('transactions')
  getUserTransactions(@Req() req: Request) {
    return this.bancosService.getUserTransactions(req.user as FirebaseUser);
  }

  @Get(':id')
  async getBancoById(@Param('id') id: string, @Req() req: Request) {
    const banco = await this.bancosService.getBancoById(id, req.user as FirebaseUser);
    if (!banco) throw new NotFoundException('Cartera no encontrada');
    return banco;
  }

  @Patch(':id')
  updateBanco(
    @Param('id') id: string,
    @Body() dto: UpdateBancoDto,
    @Req() req: Request,
  ) {
    return this.bancosService.updateBanco(id, dto, req.user as FirebaseUser);
  }

  @Delete(':id')
  deleteBanco(@Param('id') id: string, @Req() req: Request) {
    return this.bancosService.deleteBanco(id, req.user as FirebaseUser);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  adminGetAll() {
    return this.bancosService.getUserBancos({} as FirebaseUser);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  adminUpdateBanco(
    @Param('id') id: string,
    @Body() dto: AdminUpdateBancoDto,
    @Req() req: Request,
  ) {
    return this.bancosService.adminUpdateBanco(id, dto, req.user as FirebaseUser);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  adminDeleteBanco(@Param('id') id: string, @Req() req: Request) {
    return this.bancosService.adminDeleteBanco(id, req.user as FirebaseUser);
  }

  @Post(':id/depositar')
  depositar(
    @Param('id') id: string,
    @Body() dto: DepositarDto,
    @Req() req: Request,
  ) {
    return this.bancosService.depositar(id, dto, req.user as FirebaseUser);
  }

  @Post(':id/retirar')
  retirar(
    @Param('id') id: string,
    @Body() dto: RetirarDto,
    @Req() req: Request,
  ) {
    return this.bancosService.retirar(id, dto, req.user as FirebaseUser);
  }

  @Delete()
  deleteAll() {
    return this.bancosService.deleteAllBancos();
  }
}
