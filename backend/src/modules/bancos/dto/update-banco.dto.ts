import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdateBancoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['debito', 'credito'])
  tipoCuenta?: 'debito' | 'credito';
}
