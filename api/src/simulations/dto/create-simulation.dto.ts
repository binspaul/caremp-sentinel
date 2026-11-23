import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateSimulationDto {
  @IsNotEmpty()
  @IsInt()
  residentId: number;

  @IsNotEmpty()
  @IsInt()
  conditionType: number;
}
