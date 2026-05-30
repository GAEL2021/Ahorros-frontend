import { IsString, IsBoolean, IsNumber, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  texto?: string;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoReal?: number;
}
