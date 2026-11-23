import { PartialType } from '@nestjs/mapped-types';
import { IsInt } from 'class-validator';

import { CreateRoleDto } from './create-role.dto';

export class DeleteRoleDto extends PartialType(CreateRoleDto) {
  @IsInt()
  deletedBy: number;
}
