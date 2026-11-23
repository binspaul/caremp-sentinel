import { IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import {
  GeneticRiskTier,
  PolygenicRiskScoreData,
  PharmacogenomicVariantData,
  DrugGeneAlertData,
} from '../entities/genomic-profile.entity';

export class UpdateGenomicProfileDto {
  @IsEnum(GeneticRiskTier)
  @IsOptional()
  overallRiskTier?: GeneticRiskTier;

  @IsArray()
  @IsOptional()
  prsScores?: PolygenicRiskScoreData[];

  @IsArray()
  @IsOptional()
  variants?: PharmacogenomicVariantData[];

  @IsArray()
  @IsOptional()
  activeMedications?: string[];

  @IsArray()
  @IsOptional()
  activePgxAlerts?: DrugGeneAlertData[];

  @IsObject()
  @IsOptional()
  phenoCalibrations?: Record<string, any>;

  @IsObject()
  @IsOptional()
  sequencingMeta?: Record<string, any>;
}
