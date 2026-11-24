import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { Resident } from './entities/resident.entity';
import { Vital } from 'src/vitals/entities/vital.entity';
import { User } from 'src/users/entities/user.entity';
import { RoomZone } from 'src/facility/entities/room-zone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resident,
      Vital,
      User,
      RoomZone,
    ]),
  ],
  controllers: [
    ResidentsController,
  ],
  providers: [
    ResidentsService,
  ],
  exports: [
    ResidentsService,
  ],
})
export class ResidentsModule { }
