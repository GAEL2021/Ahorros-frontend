import { IsString, IsNumber, IsIn, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateGastoDto {
  @IsString() @MaxLength(200) descripcion!: string;
  @IsNumber() @Min(1) monto!: number;
  @IsString() @IsIn(['fijos', 'ocio', 'ahorro']) categoria!: 'fijos' | 'ocio' | 'ahorro';
  @IsOptional() @IsString() @IsIn(['Q1', 'Q2']) quincena?: 'Q1' | 'Q2';
}
