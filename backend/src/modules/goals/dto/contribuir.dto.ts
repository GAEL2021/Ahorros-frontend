import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ContribuirDto {
  @IsNumber()
  @Min(1)
  monto!: number;

  @IsOptional()
  @IsString()
  carteraId?: string;
}
