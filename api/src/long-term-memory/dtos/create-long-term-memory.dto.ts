import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateLongTermMemoryDto {
  @IsInt()
  @IsNotEmpty()
  residentId: number;

  @IsString()
  @IsNotEmpty()
  memoryText: string;
}
