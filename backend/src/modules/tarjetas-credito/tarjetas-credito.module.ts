import { Module } from '@nestjs/common';
import { TarjetasCreditoController } from './tarjetas-credito.controller';
import { TarjetasCreditoService } from './tarjetas-credito.service';

@Module({
  controllers: [TarjetasCreditoController],
  providers: [TarjetasCreditoService],
  exports: [TarjetasCreditoService],
})
export class TarjetasCreditoModule {}
