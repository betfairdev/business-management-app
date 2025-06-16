import { IsString, IsOptional } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

