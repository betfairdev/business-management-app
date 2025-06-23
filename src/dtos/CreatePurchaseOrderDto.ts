import { IsString, IsUUID, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../entities/PurchaseOrder';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  product!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsOptional()
  @IsString()
  specifications?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  orderNumber!: string;

  @IsUUID()
  supplier!: string;

  @IsString()
  orderDate!: string;

  @IsString()
  deliveryDate!: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items!: CreatePurchaseOrderItemDto[];

  @IsNumber()
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  shipping?: number;

  @IsNumber()
  total!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}