import { Module } from '@nestjs/common';
import { ProgramacionesController } from './programaciones.controller';
import { ProgramacionesService } from './programaciones.service';
import { BancosModule } from '../bancos/bancos.module';

@Module({
  imports: [BancosModule],
  controllers: [ProgramacionesController],
  providers: [ProgramacionesService],
  exports: [ProgramacionesService],
})
export class ProgramacionesModule {}
