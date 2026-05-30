import { IsString, IsNumber, IsISO8601, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  montoObjetivo?: number;

  @IsOptional()
  @IsISO8601()
  fechaLimite?: string;
}
