import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsInt, Min, Max } from 'class-validator';
import { OpportunityStage } from '../entities/Opportunity';

export class CreateOpportunityDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  customer?: string;

  @IsOptional()
  @IsUUID()
  lead?: string;

  @IsEnum(OpportunityStage)
  stage!: OpportunityStage;

  @IsNumber()
  value!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  probability!: number;

  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  actualCloseDate?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}