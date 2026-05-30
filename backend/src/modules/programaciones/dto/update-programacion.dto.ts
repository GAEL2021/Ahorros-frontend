import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min, Max } from 'class-validator';

export class UpdateProgramacionDto {
  @IsOptional()
  @IsString()
  @IsIn(['fijo', 'porcentaje'])
  tipo?: 'fijo' | 'porcentaje';

  @IsOptional()
  @IsNumber()
  @Min(1)
  monto?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  porcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  diaDelMes?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
