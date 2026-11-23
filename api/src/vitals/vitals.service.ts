import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vital } from './entities/vital.entity';

@Injectable()
export class VitalsService {
  private readonly logger = new Logger(VitalsService.name);

  constructor(
    @InjectRepository(Vital)
    private vitalRepository: Repository<Vital>,
  ) { }

  async getCounters() {
    const counters = await this.vitalRepository.find({});

    return counters;
  }

  async findAll(
    skip: number,
    limit: number,
    residentId?: number,
    startDate?: string,
    endDate?: string,
    sortBy?: string,
    sortOrder?: number,
  ) {
    try {
      const qb = this.vitalRepository
        .createQueryBuilder('vital')
        .where('vital.isDeleted = :isDeleted', {
          isDeleted: false,
        });

      if (residentId) {
        qb.andWhere('vital.residentId = :residentId', { residentId });
      }

      if (startDate && endDate) {
        qb.andWhere('vital.generatedAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      if (sortBy === 'generatedAt') {
        const orderDirection = Number(sortOrder) === 1 ? 'ASC' : 'DESC';
        qb.orderBy('vital.generatedAt', orderDirection);
      }

      qb.addOrderBy('vital.id', 'DESC');

      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

      return [data, total];
    } catch (error) {
      console.error('Error fetching vitals:', error);
      throw error;
    }
  }

  async findByResidentId(residentId: number) {
    const vital = await this.vitalRepository.findOne({
      where: { residentId, isDeleted: false },
      order: {
        generatedAt: 'DESC',
        id: 'DESC',
      },
    });

    return vital;
  }
}
