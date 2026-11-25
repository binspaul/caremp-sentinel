import { IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryNotificationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  isRead?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  isDismissed?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  residentId?: number;

  @IsString()
  @IsOptional()
  search?: string;
}
