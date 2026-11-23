import { IsNumber, IsOptional } from 'class-validator';

export class AssignBandDto {
  @IsNumber()
  @IsOptional()
  residentId?: number | null;
}
