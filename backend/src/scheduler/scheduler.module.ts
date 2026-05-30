import { Module } from '@nestjs/common';
import { ProgramacionesScheduler } from './programaciones.scheduler';
import { BancosModule } from '../modules/bancos/bancos.module';
import { GoalsModule } from '../modules/goals/goals.module';
import { ProgramacionesModule } from '../modules/programaciones/programaciones.module';

@Module({
  imports: [BancosModule, GoalsModule, ProgramacionesModule],
  providers: [ProgramacionesScheduler],
})
export class SchedulerModule {}
