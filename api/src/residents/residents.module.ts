import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { Resident } from './entities/resident.entity';
import { Vital } from 'src/vitals/entities/vital.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resident,
      Vital,
    ]),
  ],
  controllers: [
    ResidentsController
  ],
  providers: [
    ResidentsService,
  ],
})
export class ResidentsModule { }
