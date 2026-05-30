import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCatalogoBancoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  nombre!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icono?: string;
}
