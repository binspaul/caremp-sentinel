import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FallIncident } from './entities/fall-incident.entity';
import { Resident } from '../residents/entities/resident.entity';
import { Band } from '../bands/entities/band.entity';
import { FallsService } from './falls.service';
import { FallsController } from './falls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FallIncident, Resident, Band])],
  controllers: [FallsController],
  providers: [FallsService],
  exports: [FallsService],
})
export class FallsModule {}
