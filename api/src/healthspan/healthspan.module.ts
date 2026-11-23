import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthspanAssessment } from './entities/healthspan-assessment.entity';
import { Resident } from '../residents/entities/resident.entity';
import { HealthspanService } from './healthspan.service';
import { HealthspanController } from './healthspan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HealthspanAssessment, Resident])],
  controllers: [HealthspanController],
  providers: [HealthspanService],
  exports: [HealthspanService],
})
export class HealthspanModule {}
