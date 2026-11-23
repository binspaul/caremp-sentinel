import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ZoneType } from '../entities/room-zone.entity';

export class CreateRoomZoneDto {
  @IsInt()
  @IsNotEmpty()
  floorId: number;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'suite',
    'corridor',
    'common',
    'dining',
    'garden',
    'staff',
    'therapy',
    'calming',
    'restricted',
  ])
  zoneType?: ZoneType;

  @IsBoolean()
  @IsOptional()
  isSafePerimeter?: boolean;

  @IsInt()
  @IsOptional()
  x?: number;

  @IsInt()
  @IsOptional()
  y?: number;

  @IsInt()
  @IsOptional()
  width?: number;

  @IsInt()
  @IsOptional()
  height?: number;

  @IsInt()
  @IsOptional()
  maxCapacity?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRoomZoneDto {
  @IsInt()
  @IsOptional()
  floorId?: number;

  @IsString()
  @IsOptional()
  roomNumber?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'suite',
    'corridor',
    'common',
    'dining',
    'garden',
    'staff',
    'therapy',
    'calming',
    'restricted',
  ])
  zoneType?: ZoneType;

  @IsBoolean()
  @IsOptional()
  isSafePerimeter?: boolean;

  @IsInt()
  @IsOptional()
  x?: number;

  @IsInt()
  @IsOptional()
  y?: number;

  @IsInt()
  @IsOptional()
  width?: number;

  @IsInt()
  @IsOptional()
  height?: number;

  @IsInt()
  @IsOptional()
  maxCapacity?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
