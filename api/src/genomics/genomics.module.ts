import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenomicProfile } from './entities/genomic-profile.entity';
import { Resident } from '../residents/entities/resident.entity';
import { GenomicsService } from './genomics.service';
import { GenomicsController } from './genomics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GenomicProfile, Resident])],
  controllers: [GenomicsController],
  providers: [GenomicsService],
  exports: [GenomicsService],
})
export class GenomicsModule {}
