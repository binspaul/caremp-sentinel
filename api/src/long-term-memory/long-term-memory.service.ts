import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Resident } from 'src/residents/entities/resident.entity';
import { LongTermMemory } from './entities/long-term-memory.entity';
import { CreateLongTermMemoryDto } from './dtos/create-long-term-memory.dto';

@Injectable()
export class LongTermMemoryService {
  private readonly logger = new Logger(LongTermMemoryService.name);

  constructor(
    @InjectRepository(LongTermMemory)
    private readonly longTermMemoryRepository: Repository<LongTermMemory>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) { }

  async findByResidentId(residentId: number): Promise<LongTermMemory | null> {
    return this.longTermMemoryRepository.findOne({
      where: { residentId },
    });
  }

  async upsert(createLongTermMemoryDto: CreateLongTermMemoryDto): Promise<LongTermMemory> {
    const { residentId, memoryText } = createLongTermMemoryDto;

    const resident = await this.residentRepository.findOne({
      where: { id: residentId, isDeleted: false },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    let longTermMemory = await this.findByResidentId(residentId);

    if (longTermMemory) {
      longTermMemory.memoryText = memoryText;
    } else {
      longTermMemory = this.longTermMemoryRepository.create({
        residentId,
        memoryText,
        createdBy: residentId,
        updatedBy: residentId,
      });
    }

    return this.longTermMemoryRepository.save(longTermMemory);
  }
}
