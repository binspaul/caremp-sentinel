import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Floor } from './entities/floor.entity';
import { RoomZone } from './entities/room-zone.entity';
import { Beacon } from './entities/beacon.entity';
import { Resident } from '../residents/entities/resident.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { FacilityService } from './facility.service';
import { FacilityController } from './facility.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Floor, RoomZone, Beacon, Resident, Notification]),
  ],
  controllers: [FacilityController],
  providers: [FacilityService],
  exports: [FacilityService],
})
export class FacilityModule {}
