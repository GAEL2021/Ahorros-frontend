import { IsString, IsBoolean, IsNumber, IsOptional, IsIn, MinLength, MaxLength, Min } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(300) texto?: string;
  @IsOptional() @IsBoolean() completado?: boolean;
  @IsOptional() @IsNumber() @Min(0) monto?: number;
  @IsOptional() @IsNumber() @Min(0) montoReal?: number;
  @IsOptional() @IsString() fechaReal?: string;
  @IsOptional() @IsString() comprobante?: string;
  @IsOptional() @IsBoolean() ignorarExceso?: boolean;
  @IsOptional() @IsString() carteraId?: string;
  @IsOptional() @IsString() @IsIn(['efectivo', 'debito', 'tarjeta_credito']) medioDePago?: string;
  @IsOptional() @IsString() tarjetaCreditoId?: string;
}
