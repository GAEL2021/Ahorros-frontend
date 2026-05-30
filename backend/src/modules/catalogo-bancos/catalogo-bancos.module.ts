import { Module } from '@nestjs/common';
import { CatalogoBancosController } from './catalogo-bancos.controller';
import { CatalogoBancosService } from './catalogo-bancos.service';

@Module({
  controllers: [CatalogoBancosController],
  providers: [CatalogoBancosService],
  exports: [CatalogoBancosService],
})
export class CatalogoBancosModule {}
