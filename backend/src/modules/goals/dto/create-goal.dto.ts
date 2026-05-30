import {
  IsString,
  IsNumber,
  IsISO8601,
  IsOptional,
  IsArray,
  IsEmail,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @IsNumber()
  @Min(1)
  montoObjetivo!: number;

  @IsISO8601()
  fechaLimite!: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  invitadosEmails?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'automatico'])
  modoAporte?: 'manual' | 'automatico';

  @IsOptional()
  @IsString()
  carteraId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['fijo', 'porcentaje'])
  programacionTipo?: 'fijo' | 'porcentaje';

  @IsOptional()
  @IsNumber()
  @Min(1)
  programacionMonto?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  programacionPorcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  programacionDia?: number;
}

