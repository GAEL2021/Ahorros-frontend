import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class SimularPagoDto {
  @IsNumber() @Min(1) monto!: number;
  @IsOptional() @IsString() carteraId?: string;
}
