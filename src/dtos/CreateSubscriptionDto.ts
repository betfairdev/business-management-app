import { IsUUID, IsEnum, IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { SubscriptionPlan } from '../entities/Subscription';

export class CreateSubscriptionDto {
  @IsUUID()
  userId!: string;

  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}