import { IsString, IsNumber, IsIn, IsOptional, Min, MaxLength } from 'class-validator';

export class CreatePresupuestoDto {
  @IsString() carteraId!: string;
  @IsString() @IsIn(['mensual', 'quincenal']) tipo!: 'mensual' | 'quincenal';
  @IsOptional() @IsNumber() @Min(0) salarioMensual?: number;
  @IsOptional() @IsNumber() @Min(0) salarioQ1?: number;
  @IsOptional() @IsNumber() @Min(0) salarioQ2?: number;
  @IsNumber() @Min(0) sobranteAnterior!: number;
  @IsNumber() @Min(0) efectivoExtra!: number;
  @IsNumber() @Min(0) metaFijos!: number;
  @IsNumber() @Min(0) metaOcio!: number;
  @IsNumber() @Min(0) metaAhorro!: number;
}
