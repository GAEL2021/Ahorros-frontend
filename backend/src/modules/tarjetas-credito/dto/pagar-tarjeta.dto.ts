import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class PagarTarjetaDto {
  @IsNumber() @Min(1) monto!: number;
  @IsString() carteraId!: string;
}
