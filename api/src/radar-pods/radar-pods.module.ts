import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RadarPod } from './entities/radar-pod.entity';
import { Resident } from '../residents/entities/resident.entity';
import { RadarPodsController } from './radar-pods.controller';
import { RadarPodsService } from './radar-pods.service';

@Module({
  imports: [TypeOrmModule.forFeature([RadarPod, Resident])],
  controllers: [RadarPodsController],
  providers: [RadarPodsService],
  exports: [RadarPodsService],
})
export class RadarPodsModule {}
