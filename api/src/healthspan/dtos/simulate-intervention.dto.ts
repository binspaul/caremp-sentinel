import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class SimulateInterventionDto {
  @IsString()
  @IsNotEmpty()
  protocol: string;

  @IsNumber()
  @IsOptional()
  monthsOfIntervention?: number;

  @IsNumber()
  @IsOptional()
  biologicalAgeReductionYears?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
