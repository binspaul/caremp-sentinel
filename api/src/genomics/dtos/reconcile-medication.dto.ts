import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ReconcileMedicationDto {
  @IsString()
  @IsNotEmpty()
  originalMedication: string;

  @IsString()
  @IsNotEmpty()
  alternativeMedication: string;

  @IsString()
  @IsOptional()
  clinicalNotes?: string;

  @IsString()
  @IsOptional()
  reconciledBy?: string;
}
