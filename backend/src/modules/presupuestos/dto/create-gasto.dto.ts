import { IsString, IsNumber, IsIn, IsOptional, Min, MaxLength, IsBoolean } from 'class-validator';

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
}

export class UpdateGastoDto {
  @IsOptional() @IsNumber() @Min(0) monto?: number;
  @IsOptional() @IsNumber() @Min(0) montoEstimado?: number;
  @IsOptional() @IsNumber() @Min(0) montoFinal?: number;
  @IsOptional() @IsBoolean() estaConciliado?: boolean;
  @IsOptional() @IsString() @MaxLength(200) descripcion?: string;
  @IsOptional() @IsString() @IsIn(['fijos', 'ocio', 'ahorro']) categoria?: 'fijos' | 'ocio' | 'ahorro';
  @IsOptional() @IsNumber() @Min(0) cuotasRestantes?: number;
}
