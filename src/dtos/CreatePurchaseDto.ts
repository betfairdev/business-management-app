// src/dtos/CreatePurchaseDto.ts
import {
  IsDateString,
  IsOptional,
  IsUUID,
  IsNumberString,
  IsEnum,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PurchaseStatus } from '../entities/Purchase';
import { CreatePurchaseProductDto } from './CreatePurchaseProductDto';
import { Type } from 'class-transformer';

export class CreatePurchaseDto {
  @IsDateString() purchaseDate!: string;
  @IsOptional() @IsUUID() supplier?: string;
  @IsOptional() @IsUUID() store?: string;
  @IsOptional() @IsUUID() employee?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseProductDto)
  items?: CreatePurchaseProductDto[];
  @IsNumberString() subTotal!: string;
  @IsOptional() @IsNumberString() discount?: string;
  @IsOptional() @IsNumberString() taxAmount?: string;
  @IsOptional() @IsNumberString() shippingCharge?: string;
  @IsNumberString() totalAmount!: string;
  @IsNumberString() dueAmount!: string;
  @IsOptional() @IsUUID() paymentMethod?: number;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  receiptOrAny?: string[];
  @IsEnum(PurchaseStatus) status!: PurchaseStatus;
  @IsOptional() @IsString() notes?: string;
}
