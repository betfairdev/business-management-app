import { IsString, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { FeatureType } from '../entities/Feature';

export class CreateFeatureDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(FeatureType)
  type!: FeatureType;

  @IsOptional()
  limits?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableInPlans?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}