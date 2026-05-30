import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  texto?: string;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;
}
