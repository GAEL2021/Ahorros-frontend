import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CatalogoBancosService } from './catalogo-bancos.service';
import { CreateCatalogoBancoDto } from './dto/create-catalogo-banco.dto';
import { UpdateCatalogoBancoDto } from './dto/update-catalogo-banco.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('catalogo-bancos')
@UseGuards(FirebaseAuthGuard)
export class CatalogoBancosController {
  constructor(private readonly catalogoBancosService: CatalogoBancosService) {}

  @Get()
  @UseGuards(AdminGuard)
  getAll() {
    return this.catalogoBancosService.getAll();
  }

  @Get('disponibles')
  getPublicos() {
    return this.catalogoBancosService.getPublicos();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateCatalogoBancoDto) {
    return this.catalogoBancosService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCatalogoBancoDto) {
    return this.catalogoBancosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  delete(@Param('id') id: string) {
    return this.catalogoBancosService.delete(id);
  }
}
