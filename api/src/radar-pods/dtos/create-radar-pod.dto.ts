import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { RadarInstallationType, RadarPodStatus } from '../entities/radar-pod.entity';

export class CreateRadarPodDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  macAddress: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  frequencyBand?: string;

  @IsEnum(RadarInstallationType)
  @IsOptional()
  installationType?: RadarInstallationType;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(20.0)
  detectionRangeMeters?: number;

  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @IsString()
  @IsOptional()
  powerSource?: string;

  @IsEnum(RadarPodStatus)
  @IsOptional()
  status?: RadarPodStatus;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsString()
  @IsOptional()
  roomNumber?: string;

  @IsNumber()
  @IsOptional()
  assignedResidentId?: number | null;

  @IsString()
  @IsOptional()
  notes?: string;
}
