import { IsString, MinLength, MaxLength } from 'class-validator';

export class JoinGoalDto {
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  codigo!: string;
}
