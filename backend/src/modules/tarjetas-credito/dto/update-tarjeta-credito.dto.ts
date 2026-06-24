import { IsString, IsNumber, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class UpdateTarjetaCreditoDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) nombre?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) bancoEmisor?: string;
  @IsOptional() @IsNumber() @Min(1) limiteCredito?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(31) fechaCorte?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(31) fechaPago?: number;
}
