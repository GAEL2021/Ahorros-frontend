import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEmail,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBancoDto {
  @IsString()
  catalogoBancoId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saldoInicial?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['debito', 'credito'])
  tipoCuenta?: 'debito' | 'credito';

  @IsOptional()
  @IsString()
  @IsIn(['personal', 'compartida'])
  tipo?: 'personal' | 'compartida';

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  invitadosEmails?: string[];
}
