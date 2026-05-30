import { IsString, IsNumber, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

export class CreateChecklistItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  texto!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;
}
