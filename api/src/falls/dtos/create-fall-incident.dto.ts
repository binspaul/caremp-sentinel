import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { FallSeverity, FallIncidentStatus } from '../entities/fall-incident.entity';

export class CreateFallIncidentDto {
  @IsNumber()
  @IsNotEmpty()
  residentId: number;

  @IsNumber()
  @IsOptional()
  bandId?: number;

  @IsNumber()
  @IsOptional()
  impactForceG?: number;

  @IsNumber()
  @IsOptional()
  orientationChangeDeg?: number;

  @IsNumber()
  @IsOptional()
  motionlessDurationSeconds?: number;

  @IsEnum(FallSeverity)
  @IsOptional()
  severity?: FallSeverity;

  @IsEnum(FallIncidentStatus)
  @IsOptional()
  status?: FallIncidentStatus;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  clinicalDescription?: string;
}
