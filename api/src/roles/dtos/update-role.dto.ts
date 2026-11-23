import { PartialType } from '@nestjs/mapped-types';
import { IsInt } from 'class-validator';

import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @IsInt()
    updatedBy: number;
}
