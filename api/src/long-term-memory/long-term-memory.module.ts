import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Resident } from 'src/residents/entities/resident.entity';
import { LongTermMemory } from './entities/long-term-memory.entity';

import { ResidentsService } from 'src/residents/residents.service';
import { LongTermMemoryService } from './long-term-memory.service';
import { LongTermMemoryController } from './long-term-memory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LongTermMemory, Resident,])],
  controllers: [LongTermMemoryController],
  providers: [LongTermMemoryService, ResidentsService,],
  exports: [LongTermMemoryService],
})
export class LongTermMemoryModule { }
