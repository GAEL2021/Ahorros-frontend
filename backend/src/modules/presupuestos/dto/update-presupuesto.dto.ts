import { IsString, IsNumber, IsIn, IsOptional, Min, Max } from 'class-validator';

export class UpdatePresupuestoDto {
  @IsOptional() @IsNumber() @Min(0) salarioMensual?: number;
  @IsOptional() @IsNumber() @Min(0) salarioQ1?: number;
  @IsOptional() @IsNumber() @Min(0) salarioQ2?: number;
  @IsOptional() @IsNumber() @Min(0) sobranteAnterior?: number;
  @IsOptional() @IsNumber() @Min(0) efectivoExtra?: number;
}
