import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateBancoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;
}
