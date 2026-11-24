import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignRadarPodDto {
  @IsNumber()
  @IsOptional()
  residentId?: number | null;

  @IsString()
  @IsOptional()
  roomNumber?: string;
}
