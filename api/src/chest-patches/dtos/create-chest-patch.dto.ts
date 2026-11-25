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
import {
  ChestPatchType,
  AdhesionStatus,
  ChestPatchStatus,
} from '../entities/chest-patch.entity';

export class CreateChestPatchDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  macAddress: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsEnum(ChestPatchType)
  @IsOptional()
  patchType?: ChestPatchType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsEnum(AdhesionStatus)
  @IsOptional()
  adhesionStatus?: AdhesionStatus;

  @IsNumber()
  @IsOptional()
  wearDurationDays?: number;

  @IsNumber()
  @IsOptional()
  maxWearDays?: number;

  @IsNumber()
  @IsOptional()
  skinTempCelsius?: number;

  @IsBoolean()
  @IsOptional()
  isWorn?: boolean;

  @IsNumber()
  @IsOptional()
  rssi?: number;

  @IsEnum(ChestPatchStatus)
  @IsOptional()
  status?: ChestPatchStatus;

  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @IsNumber()
  @IsOptional()
  assignedResidentId?: number | null;

  @IsString()
  @IsOptional()
  notes?: string;
}
