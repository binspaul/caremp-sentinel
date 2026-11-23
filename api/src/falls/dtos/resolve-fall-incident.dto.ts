import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FallIncidentStatus } from '../entities/fall-incident.entity';

export class ResolveFallIncidentDto {
  @IsEnum(FallIncidentStatus)
  status: FallIncidentStatus;

  @IsString()
  @IsOptional()
  resolvedBy?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
