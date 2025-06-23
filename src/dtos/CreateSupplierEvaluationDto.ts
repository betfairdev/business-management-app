import { IsUUID, IsString, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateSupplierEvaluationDto {
  @IsUUID()
  supplier!: string;

  @IsUUID()
  evaluator!: string;

  @IsString()
  evaluationDate!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  qualityScore!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  deliveryScore!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  serviceScore!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  priceScore!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  onTimeDeliveryRate!: number;

  @IsOptional()
  @IsString()
  comments?: string;
}