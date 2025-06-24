import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { WhatsAppProvider } from '../entities/WhatsAppConfig';

export class CreateWhatsAppConfigDto {
  @IsString()
  name!: string;

  @IsEnum(WhatsAppProvider)
  provider!: WhatsAppProvider;

  @IsString()
  accessToken!: string;

  @IsString()
  phoneNumberId!: string;

  @IsString()
  businessAccountId!: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  verifyToken?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  additionalSettings?: Record<string, any>;
}