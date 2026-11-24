import { IsNumber, IsOptional } from 'class-validator';

export class AssignChestPatchDto {
  @IsNumber()
  @IsOptional()
  residentId?: number | null;
}
