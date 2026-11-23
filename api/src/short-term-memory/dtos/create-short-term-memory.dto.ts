import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShortTermMemoryDto {
  @IsInt()
  @IsNotEmpty()
  residentId: number;

  @IsString()
  @IsNotEmpty()
  memoryText: string;

  @IsOptional()
  @IsInt()
  ttlDays?: number;
}

