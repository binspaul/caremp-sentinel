import { PartialType } from '@nestjs/mapped-types';
import { CreateRadarPodDto } from './create-radar-pod.dto';

export class UpdateRadarPodDto extends PartialType(CreateRadarPodDto) {}
