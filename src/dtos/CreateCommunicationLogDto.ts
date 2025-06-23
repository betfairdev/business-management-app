import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { CommunicationType, CommunicationDirection } from '../entities/CommunicationLog';

export class CreateCommunicationLogDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsEnum(CommunicationType)
  type!: CommunicationType;

  @IsEnum(CommunicationDirection)
  direction!: CommunicationDirection;

  @IsString()
  subject!: string;

  @IsString()
  content!: string;

  @IsString()
  date!: string;

  @IsString()
  time!: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  followUpDate?: string;
}