import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DigitalTwin } from './entities/digital-twin.entity';
import { Resident } from 'src/residents/entities/resident.entity';
import { DigitalTwinService } from './digital-twin.service';
import { DigitalTwinController } from './digital-twin.controller';
import { ResidentsService } from 'src/residents/residents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DigitalTwin,
      Resident,
    ]),
  ],
  controllers: [DigitalTwinController],
  providers: [DigitalTwinService, ResidentsService,],
  exports: [DigitalTwinService],
})
export class DigitalTwinModule { }
