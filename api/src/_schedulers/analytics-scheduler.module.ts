import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Resident } from 'src/residents/entities/resident.entity';
import { RoomZone } from 'src/facility/entities/room-zone.entity';
import { DigitalTwinModule } from 'src/digital-twin/digital-twin.module';

import { AnalyticsSchedulerService } from './analytics-scheduler.service';
import { AnalyticsSchedulerController } from './analytics-scheduler.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resident,
      RoomZone,
    ]),
    DigitalTwinModule,
    HttpModule,
  ],
  controllers: [
    AnalyticsSchedulerController,
  ],
  providers: [
    AnalyticsSchedulerService,
  ],
  exports: [
    AnalyticsSchedulerService,
  ],
})
export class AnalyticsSchedulerModule { }
