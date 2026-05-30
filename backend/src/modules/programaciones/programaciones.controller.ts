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
} from '@nestjs/common';
import { ProgramacionesService } from './programaciones.service';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';
import { FirebaseAuthGuard, FirebaseUser } from '../../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('programaciones')
@UseGuards(FirebaseAuthGuard)
export class ProgramacionesController {
  constructor(private readonly programacionesService: ProgramacionesService) {}

  @Post()
  create(@Body() dto: CreateProgramacionDto, @Req() req: Request) {
    return this.programacionesService.createProgramacion(
      dto,
      req.user as FirebaseUser,
    );
  }

  @Get()
  getUserProgramaciones(@Req() req: Request) {
    return this.programacionesService.getUserProgramaciones(
      req.user as FirebaseUser,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProgramacionDto,
    @Req() req: Request,
  ) {
    return this.programacionesService.updateProgramacion(
      id,
      dto,
      req.user as FirebaseUser,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.programacionesService.deleteProgramacion(
      id,
      req.user as FirebaseUser,
    );
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Req() req: Request) {
    return this.programacionesService.toggleProgramacion(
      id,
      req.user as FirebaseUser,
    );
  }
}
