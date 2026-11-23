import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Resident } from 'src/residents/entities/resident.entity';
import { ShortTermMemory } from './entities/short-term-memory.entity';

import { ResidentsService } from 'src/residents/residents.service';
import { ShortTermMemoryService } from './short-term-memory.service';
import { ShortTermMemoryController } from './short-term-memory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShortTermMemory, Resident])],
  controllers: [ShortTermMemoryController],
  providers: [ShortTermMemoryService, ResidentsService],
  exports: [ShortTermMemoryService],
})
export class ShortTermMemoryModule { }
