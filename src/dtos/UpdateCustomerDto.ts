// src/dtos/UpdateCustomerDto.ts
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsEnum(['Active','Inactive']) status?: 'Active'|'Inactive';
}
