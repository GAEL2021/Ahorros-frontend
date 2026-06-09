import { IsString, IsNumber, IsIn, IsOptional, Min, ValidateNested, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGastoDto } from './create-gasto.dto';

export class CreatePresupuestoDto {
  @IsOptional() @IsString() carteraId?: string;
  @IsString() @IsIn(['mensual', 'quincenal']) tipo!: 'mensual' | 'quincenal';
  @IsOptional() @IsNumber() @Min(0) salarioMensual?: number;
  @IsOptional() @IsNumber() @Min(0) salarioQ1?: number;
  @IsOptional() @IsNumber() @Min(0) salarioQ2?: number;
  @IsNumber() @Min(0) sobranteAnterior!: number;
  @IsNumber() @Min(0) efectivoExtra!: number;
  @IsOptional() @IsNumber() @Min(0) metaFijos?: number;
  @IsOptional() @IsNumber() @Min(0) metaOcio?: number;
  @IsOptional() @IsNumber() @Min(0) metaAhorro?: number;
  @IsOptional() @IsString() fecha?: string;
  @IsOptional() @IsNumber() @Min(2020) @Max(2100) year?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(12) mes?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(12) mesDesde?: number;
  @IsOptional() @IsString() controlId?: string;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => CreateGastoDto) gastosFijos?: CreateGastoDto[];
}
