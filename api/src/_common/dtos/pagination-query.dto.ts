import { Transform, Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional, IsBoolean, IsString, IsDate } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  skip: number = 0;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(10000)
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  residentId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate: string | Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate: string | Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return false;

    if (typeof value === 'string') {
      const lowered = value.toLowerCase();

      if (['true', '1'].includes(lowered)) return true;

      if (['false', '0'].includes(lowered)) return false;

      return false;
    }

    if (typeof value === 'number') return value === 1;

    return false;
  })
  @IsBoolean()
  showDeleted: boolean = false;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  sortOrder: number;
}
