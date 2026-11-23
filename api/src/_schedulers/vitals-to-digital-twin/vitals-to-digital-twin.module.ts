import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DigitalTwin } from '../../digital-twin/entities/digital-twin.entity';
import { Resident } from '../../residents/entities/resident.entity';
import { Vital } from '../../vitals/entities/vital.entity';

import { VitalsToDigitalTwinService } from './vitals-to-digital-twin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DigitalTwin,
      Resident,
      Vital,
    ]),
  ],
  providers: [
    VitalsToDigitalTwinService,
  ],
  exports: [
    VitalsToDigitalTwinService,
  ],
})
export class VitalsToDigitalTwinModule { }

