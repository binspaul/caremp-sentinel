import { PartialType } from '@nestjs/mapped-types';
import { CreateResidentDto } from './create-resident.dto';
import { IsInt } from 'class-validator';

export class UpdateResidentDto extends PartialType(CreateResidentDto) {
  @IsInt()
  updatedBy: number;
}
