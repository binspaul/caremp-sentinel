import { IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, IsIn } from 'class-validator';
import { BeaconStatus } from '../entities/beacon.entity';

export class CreateBeaconDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  macAddress: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  zoneId?: number | null;

  @IsInt()
  @IsOptional()
  major?: number;

  @IsInt()
  @IsOptional()
  minor?: number;

  @IsInt()
  @IsOptional()
  rssiCalibrated1m?: number;

  @IsNumber()
  @IsOptional()
  batteryLevel?: number;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'low_battery', 'offline', 'maintenance'])
  status?: BeaconStatus;

  @IsInt()
  @IsOptional()
  txIntervalHz?: number;
}

export class UpdateBeaconDto {
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  macAddress?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  zoneId?: number | null;

  @IsInt()
  @IsOptional()
  major?: number;

  @IsInt()
  @IsOptional()
  minor?: number;

  @IsInt()
  @IsOptional()
  rssiCalibrated1m?: number;

  @IsNumber()
  @IsOptional()
  batteryLevel?: number;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'low_battery', 'offline', 'maintenance'])
  status?: BeaconStatus;

  @IsInt()
  @IsOptional()
  txIntervalHz?: number;
}

export class AssignBeaconDto {
  @IsInt()
  @IsOptional()
  zoneId: number | null;
}
