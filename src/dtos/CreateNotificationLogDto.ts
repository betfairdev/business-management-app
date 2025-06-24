import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType, NotificationStatus } from '../entities/NotificationLog';

export class CreateNotificationLogDto {
  @IsUUID()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationStatus)
  status!: NotificationStatus;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  sentAt?: Date;

  @IsOptional()
  deliveredAt?: Date;

  @IsOptional()
  readAt?: Date;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}