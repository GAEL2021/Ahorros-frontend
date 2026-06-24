import { IsString, IsNumber, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateTarjetaCreditoDto {
  @IsString() @MinLength(2) @MaxLength(100) nombre!: string;
  @IsString() @MinLength(2) @MaxLength(100) bancoEmisor!: string;
  @IsNumber() @Min(1) limiteCredito!: number;
  @IsNumber() @Min(1) @Max(31) fechaCorte!: number;
  @IsNumber() @Min(1) @Max(31) fechaPago!: number;
}
