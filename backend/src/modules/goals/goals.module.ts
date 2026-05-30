import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { BancosModule } from '../bancos/bancos.module';
import { ProgramacionesModule } from '../programaciones/programaciones.module';

@Module({
  imports: [BancosModule, ProgramacionesModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
