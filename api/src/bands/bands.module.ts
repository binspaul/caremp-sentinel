import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Band } from './entities/band.entity';
import { Resident } from '../residents/entities/resident.entity';
import { BandsService } from './bands.service';
import { BandsController } from './bands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Band, Resident])],
  controllers: [BandsController],
  providers: [BandsService],
  exports: [BandsService],
})
export class BandsModule {}
