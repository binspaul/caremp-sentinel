import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateFloorDto {
  @IsInt()
  @IsNotEmpty()
  floorNumber: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  layoutWidth?: number;

  @IsInt()
  @IsOptional()
  layoutHeight?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFloorDto {
  @IsInt()
  @IsOptional()
  floorNumber?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  layoutWidth?: number;

  @IsInt()
  @IsOptional()
  layoutHeight?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
