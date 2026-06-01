import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AdminUpdateBancoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;
}
