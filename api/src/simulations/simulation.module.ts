import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Resident } from '../residents/entities/resident.entity';
import { Vital } from '../vitals/entities/vital.entity';
import { ResidentsService } from '../residents/residents.service';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { FallsModule } from '../falls/falls.module';
import { HealthspanModule } from '../healthspan/healthspan.module';
import { GenomicsModule } from '../genomics/genomics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vital,
      Resident,
    ]),
    FallsModule,
    HealthspanModule,
    GenomicsModule,
  ],
  controllers: [SimulationController],
  providers: [SimulationService, ResidentsService],
  exports: [SimulationService],
})
export class SimulationModule { }
