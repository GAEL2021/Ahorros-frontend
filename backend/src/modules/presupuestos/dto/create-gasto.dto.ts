import { IsString, IsNumber, IsIn, IsOptional, Min, MaxLength, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGastoDto {
  @IsString() @MaxLength(200) descripcion!: string;
  @IsNumber() @Min(1) monto!: number;
  @IsOptional() @IsNumber() @Min(0) montoEstimado?: number;
  @IsOptional() @IsNumber() @Min(0) montoFinal?: number;
  @IsOptional() @IsBoolean() estaConciliado?: boolean;
  @IsString() @IsIn(['fijos', 'ocio', 'ahorro']) categoria!: 'fijos' | 'ocio' | 'ahorro';
  @IsOptional() @IsString() @IsIn(['Q1', 'Q2']) quincena?: 'Q1' | 'Q2';
  @IsOptional() @IsBoolean() esFijo?: boolean;
  @IsOptional() @IsNumber() @Min(0) cuotas?: number;
  @IsOptional() @IsString() fechaPago?: string;
  @IsOptional() @IsString() fecha?: string;
  @IsOptional() @IsBoolean() esRecurrente?: boolean;
  @IsOptional() @IsString() @IsIn(['quincenal', 'mensual']) recurrenciaTipo?: 'quincenal' | 'mensual';
  @IsOptional() @IsString() recurrenciaGrupoId?: string;
  @IsOptional() @IsString() fechaOrigen?: string;
  @IsOptional() @IsString() carteraId?: string;
  @IsOptional() @IsString() @IsIn(['efectivo', 'debito', 'tarjeta_credito']) medioDePago?: string;
  @IsOptional() @IsString() tarjetaCreditoId?: string;
}

export class UpdateGastoDto {
  @IsOptional() @IsNumber() @Min(0) monto?: number;
  @IsOptional() @IsNumber() @Min(0) montoEstimado?: number;
  @IsOptional() @IsNumber() @Min(0) montoFinal?: number;
  @IsOptional() @IsBoolean() estaConciliado?: boolean;
  @IsOptional() @IsString() @MaxLength(200) descripcion?: string;
  @IsOptional() @IsString() @IsIn(['fijos', 'ocio', 'ahorro']) categoria?: 'fijos' | 'ocio' | 'ahorro';
  @IsOptional() @IsNumber() @Min(0) cuotasRestantes?: number;
  @IsOptional() @IsString() fecha?: string;
  @IsOptional() @IsBoolean() esRecurrente?: boolean;
  @IsOptional() @IsString() @IsIn(['quincenal', 'mensual']) recurrenciaTipo?: 'quincenal' | 'mensual';
  @IsOptional() @IsString() recurrenciaGrupoId?: string;
  @IsOptional() @IsString() fechaOrigen?: string;
  @IsOptional() @IsString() carteraId?: string;
  @IsOptional() @IsString() @IsIn(['efectivo', 'debito', 'tarjeta_credito']) medioDePago?: string;
  @IsOptional() @IsString() tarjetaCreditoId?: string;
}

export class UpdateGastoFechaDto {
  @IsString() fecha!: string;
}

export class PagarGastoDto {
  @IsOptional() @IsNumber() @Min(0) montoReal?: number;
  @IsOptional() @IsString() carteraId?: string;
  @IsOptional() @IsString() @IsIn(['efectivo', 'debito', 'tarjeta_credito']) medioDePago?: string;
  @IsOptional() @IsString() tarjetaCreditoId?: string;
}
