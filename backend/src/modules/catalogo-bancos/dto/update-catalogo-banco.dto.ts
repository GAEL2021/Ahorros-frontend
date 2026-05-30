import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCatalogoBancoDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icono?: string;
}
