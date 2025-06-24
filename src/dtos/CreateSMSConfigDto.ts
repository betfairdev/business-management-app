import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SMSProvider } from '../entities/SMSConfig';

export class CreateSMSConfigDto {
  @IsString()
  name!: string;

  @IsEnum(SMSProvider)
  provider!: SMSProvider;

  @IsString()
  apiKey!: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  accountSid?: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  additionalSettings?: Record<string, any>;
}