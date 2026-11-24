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
import { BandStatus } from '../entities/band.entity';

export class CreateBandDto {
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
  firmwareVersion?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsBoolean()
  @IsOptional()
  isWorn?: boolean;

  @IsNumber()
  @IsOptional()
  rssi?: number;

  @IsEnum(BandStatus)
  @IsOptional()
  status?: BandStatus;

  @IsNumber()
  @IsOptional()
  assignedResidentId?: number | null;

  @IsString()
  @IsOptional()
  notes?: string;
}
