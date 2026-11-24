import { PartialType } from '@nestjs/mapped-types';
import { CreateChestPatchDto } from './create-chest-patch.dto';

export class UpdateChestPatchDto extends PartialType(CreateChestPatchDto) {}
