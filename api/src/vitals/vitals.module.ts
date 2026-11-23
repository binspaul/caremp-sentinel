import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Resident } from 'src/residents/entities/resident.entity';
import { ResidentsService } from 'src/residents/residents.service';

import { Vital } from './entities/vital.entity';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vital,
      Resident,
    ]),
  ],
  controllers: [VitalsController],
  providers: [VitalsService, ResidentsService,],
  exports: [VitalsService],
})
export class VitalsModule { }
