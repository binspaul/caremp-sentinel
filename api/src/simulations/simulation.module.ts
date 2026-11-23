import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Resident } from '../residents/entities/resident.entity';
import { Vital } from '../vitals/entities/vital.entity';
import { ResidentsService } from 'src/residents/residents.service';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vital,
      Resident,
    ]),
  ],
  controllers: [SimulationController],
  providers: [SimulationService, ResidentsService,],
  exports: [SimulationService],
})
export class SimulationModule { }
