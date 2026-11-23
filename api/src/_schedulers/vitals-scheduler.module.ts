import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Vital } from '../vitals/entities/vital.entity';
import { Resident } from '../residents/entities/resident.entity';

import { VitalsSchedulerService } from './vitals-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vital,
      Resident,
    ]),
  ],
  providers: [
    VitalsSchedulerService,
  ],
  exports: [
    VitalsSchedulerService,
  ],
})
export class VitalsSchedulerModule { }
