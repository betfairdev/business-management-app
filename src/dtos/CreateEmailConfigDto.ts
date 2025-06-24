import { IsString, IsEnum, IsInt, IsBoolean, IsOptional, IsEmail } from 'class-validator';
import { EmailProvider } from '../entities/EmailConfig';

export class CreateEmailConfigDto {
  @IsString()
  name!: string;

  @IsEnum(EmailProvider)
  provider!: EmailProvider;

  @IsString()
  host!: string;

  @IsInt()
  port!: number;

  @IsBoolean()
  secure!: boolean;

  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsEmail()
  fromEmail!: string;

  @IsString()
  fromName!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  additionalSettings?: Record<string, any>;
}