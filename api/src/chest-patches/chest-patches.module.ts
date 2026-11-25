import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChestPatch } from './entities/chest-patch.entity';
import { Resident } from '../residents/entities/resident.entity';
import { ChestPatchesController } from './chest-patches.controller';
import { ChestPatchesService } from './chest-patches.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChestPatch, Resident])],
  controllers: [ChestPatchesController],
  providers: [ChestPatchesService],
  exports: [ChestPatchesService],
})
export class ChestPatchesModule {}
