import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsDateString,
  IsArray,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';

class IdentityDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsInt()
  @IsNotEmpty()
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;
}

class BodyDto {
  @IsNumber()
  @IsNotEmpty()
  heightCm: number;

  @IsNumber()
  @IsNotEmpty()
  weightKg: number;

  @IsNumber()
  @IsOptional()
  bmi?: number;

  @IsString()
  @IsOptional()
  bloodGroup?: string;
}

class VitalDto {
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsDateString()
  @IsNotEmpty()
  timestamp: string;
}

class SleepSummaryDto {
  @IsNumber()
  @IsNotEmpty()
  deep: number;

  @IsNumber()
  @IsNotEmpty()
  light: number;

  @IsNumber()
  @IsNotEmpty()
  rem: number;
}

class PhysiologyDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  heartRate?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  hrv?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  spo2?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  systolicBP?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  diastolicBP?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  bodyTemperature?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalDto)
  steps?: VitalDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SleepSummaryDto)
  sleep?: SleepSummaryDto;
}

class BaselineDto {
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsDateString()
  @IsNotEmpty()
  updatedAt: string;
}

class SleepBaselineDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  deep?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  light?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  rem?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  totalDuration?: BaselineDto;
}

class BaselinesDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  heartRate?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  hrv?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  spo2?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  systolicBP?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  diastolicBP?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineDto)
  bodyTemperature?: BaselineDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SleepBaselineDto)
  sleep?: SleepBaselineDto;
}

class TrendResultDto {
  @IsString()
  @IsNotEmpty()
  vital: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['30m'])
  window: '30m';

  @IsString()
  @IsNotEmpty()
  @IsIn(['UP', 'DOWN', 'STABLE'])
  direction: 'UP' | 'DOWN' | 'STABLE';

  @IsNumber()
  @IsNotEmpty()
  percentageChange: number;

  @IsNumber()
  @IsNotEmpty()
  rateOfChange: number;
}

class CorrelationResultDto {
  @IsString()
  @IsNotEmpty()
  vitalPair: string;

  @IsNumber()
  @IsNotEmpty()
  coefficient: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['WEAK', 'MODERATE', 'STRONG'])
  strength: 'WEAK' | 'MODERATE' | 'STRONG';

  @IsString()
  @IsNotEmpty()
  @IsIn(['POSITIVE', 'NEGATIVE'])
  direction: 'POSITIVE' | 'NEGATIVE';
}

class PredictionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  confidence: number;

  @IsString()
  @IsNotEmpty()
  explanation: string;
}

class RecommendationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

class HealthInsightsDto {
  @IsObject()
  @IsOptional()
  sundowning?: Record<string, any>;

  @IsObject()
  @IsOptional()
  wandering?: Record<string, any>;

  @IsObject()
  @IsOptional()
  circadian?: Record<string, any>;

  @IsObject()
  @IsOptional()
  deterioration?: Record<string, any>;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PredictionDto)
  predictions?: PredictionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecommendationDto)
  recommendations?: RecommendationDto[];
}

class HealthRecordDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  summary: string;
}

class MetadataDto {
  @IsDateString()
  @IsNotEmpty()
  createdAt: string;

  @IsDateString()
  @IsNotEmpty()
  updatedAt: string;

  @IsNumber()
  @IsNotEmpty()
  twinVersion: number;
}

export class CreateDigitalTwinDto {
  @IsInt()
  @IsNotEmpty()
  residentId: number;

  @IsObject()
  @ValidateNested()
  @Type(() => IdentityDto)
  identity: IdentityDto;

  @IsObject()
  @ValidateNested()
  @Type(() => BodyDto)
  body: BodyDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PhysiologyDto)
  physiology?: PhysiologyDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BaselinesDto)
  baselines?: BaselinesDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TrendResultDto)
  trends?: TrendResultDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CorrelationResultDto)
  correlations?: CorrelationResultDto[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthInsightsDto)
  healthInsights?: HealthInsightsDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HealthRecordDto)
  healthRecords?: HealthRecordDto[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;

  @IsString()
  @IsOptional()
  aiSummary?: string;
}
