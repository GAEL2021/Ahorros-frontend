import { Module, forwardRef } from '@nestjs/common';
import { PresupuestosController } from './presupuestos.controller';
import { PresupuestosService } from './presupuestos.service';
import { TarjetasCreditoModule } from '../tarjetas-credito/tarjetas-credito.module';

@Module({
  imports: [forwardRef(() => TarjetasCreditoModule)],
  controllers: [PresupuestosController],
  providers: [PresupuestosService],
  exports: [PresupuestosService],
})
export class PresupuestosModule {}
