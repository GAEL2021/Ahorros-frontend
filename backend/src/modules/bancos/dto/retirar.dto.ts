import { IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class RetirarDto {
  @IsNumber()
  @Min(1)
  monto!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;
}
