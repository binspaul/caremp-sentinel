import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  residentId?: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['alert', 'fall', 'vital_breach', 'geofence', 'device', 'system'])
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['critical', 'high', 'medium', 'low'])
  priority: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsBoolean()
  @IsOptional()
  isDismissed?: boolean;
}
