import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Resident } from 'src/residents/entities/resident.entity';
import { ShortTermMemory } from './entities/short-term-memory.entity';
import { CreateShortTermMemoryDto } from './dtos/create-short-term-memory.dto';

@Injectable()
export class ShortTermMemoryService {
  private readonly logger = new Logger(ShortTermMemoryService.name);

  constructor(
    @InjectRepository(ShortTermMemory)
    private readonly shortTermMemoryRepository: Repository<ShortTermMemory>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) { }

  async findByResidentId(residentId: number): Promise<ShortTermMemory | null> {
    const memories = await this.shortTermMemoryRepository.find({
      where: { residentId },
      order: { createdAt: 'ASC' },
    });

    if (!memories || memories.length === 0) {
      return null;
    }

    const now = new Date();
    const activeMemories = memories.filter((m) => new Date(m.expiresAt) > now);

    if (activeMemories.length === 0) {
      return null;
    }

    const bulletList = activeMemories
      .map((m) => (m.memoryText.startsWith('- ') ? m.memoryText : `- ${m.memoryText}`))
      .join('\n');

    const result = { ...activeMemories[activeMemories.length - 1] };
    result.memoryText = bulletList;
    result.isExpired = false;

    return result as ShortTermMemory;
  }

  async upsert(
    createShortTermMemoryDto: CreateShortTermMemoryDto,
  ): Promise<ShortTermMemory> {
    const { residentId, memoryText, ttlDays } = createShortTermMemoryDto;

    const resident = await this.residentRepository.findOne({
      where: { id: residentId, isDeleted: false },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const expiresAt = new Date();
    const days = ttlDays && ttlDays > 0 ? ttlDays : 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    const shortTermMemory = this.shortTermMemoryRepository.create({
      residentId,
      memoryText,
      expiresAt,
      createdBy: residentId,
      updatedBy: residentId,
    });

    const saved = await this.shortTermMemoryRepository.save(shortTermMemory);
    saved.isExpired = new Date() > saved.expiresAt;
    return saved;
  }
}

