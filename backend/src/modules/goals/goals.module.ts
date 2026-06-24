import { Module, forwardRef } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { BancosModule } from '../bancos/bancos.module';
import { ProgramacionesModule } from '../programaciones/programaciones.module';
import { PresupuestosModule } from '../presupuestos/presupuestos.module';
import { TarjetasCreditoModule } from '../tarjetas-credito/tarjetas-credito.module';

@Module({
  imports: [BancosModule, ProgramacionesModule, PresupuestosModule, forwardRef(() => TarjetasCreditoModule)],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
