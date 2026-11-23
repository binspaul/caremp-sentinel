import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Band, BandStatus } from './entities/band.entity';
import { Resident } from '../residents/entities/resident.entity';
import { CreateBandDto } from './dtos/create-band.dto';
import { UpdateBandDto } from './dtos/update-band.dto';

@Injectable()
export class BandsService {
  constructor(
    @InjectRepository(Band)
    private readonly bandRepository: Repository<Band>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  async findAll(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    residentId?: number;
  }): Promise<[Band[], number]> {
    const qb = this.bandRepository
      .createQueryBuilder('band')
      .leftJoinAndSelect('band.assignedResident', 'resident')
      .where('band.isDeleted = false');

    if (params?.status) {
      qb.andWhere('band.status = :status', { status: params.status });
    }

    if (params?.residentId) {
      qb.andWhere('band.assignedResidentId = :residentId', {
        residentId: params.residentId,
      });
    }

    if (params?.search) {
      qb.andWhere(
        '(band.serialNumber ILIKE :search OR band.macAddress ILIKE :search OR band.model ILIKE :search OR resident.firstName ILIKE :search OR resident.lastName ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('band.id', 'ASC');

    const skip = Number(params?.skip) || 0;
    const limit = Number(params?.limit) || 50;

    return await qb.skip(skip).take(limit).getManyAndCount();
  }

  async findOne(id: number): Promise<Band> {
    const band = await this.bandRepository
      .createQueryBuilder('band')
      .leftJoinAndSelect('band.assignedResident', 'resident')
      .where('band.id = :id', { id })
      .andWhere('band.isDeleted = false')
      .getOne();

    if (!band) {
      throw new NotFoundException(`Band with ID #${id} not found.`);
    }

    return band;
  }

  async findByResident(residentId: number): Promise<Band[]> {
    return await this.bandRepository.find({
      where: { assignedResidentId: residentId, isDeleted: false },
      relations: { assignedResident: true },
    });
  }

  async getCounters(): Promise<{
    total: number;
    active: number;
    available: number;
    charging: number;
    maintenance: number;
    lowBattery: number;
    notWorn: number;
  }> {
    const bands = await this.bandRepository.find({
      where: { isDeleted: false },
    });

    const total = bands.length;
    let active = 0;
    let available = 0;
    let charging = 0;
    let maintenance = 0;
    let lowBattery = 0;
    let notWorn = 0;

    for (const b of bands) {
      if (b.status === BandStatus.ACTIVE) active++;
      else if (b.status === BandStatus.AVAILABLE) available++;
      else if (b.status === BandStatus.CHARGING) charging++;
      else if (b.status === BandStatus.MAINTENANCE) maintenance++;

      if (Number(b.batteryLevel) <= 20) {
        lowBattery++;
      }

      if (b.assignedResidentId && !b.isWorn) {
        notWorn++;
      }
    }

    return {
      total,
      active,
      available,
      charging,
      maintenance,
      lowBattery,
      notWorn,
    };
  }

  async create(createBandDto: CreateBandDto): Promise<Band> {
    const existing = await this.bandRepository.findOne({
      where: [
        { serialNumber: createBandDto.serialNumber },
        { macAddress: createBandDto.macAddress },
      ],
    });

    if (existing) {
      throw new ConflictException(
        `Band with Serial #${createBandDto.serialNumber} or MAC ${createBandDto.macAddress} already exists.`,
      );
    }

    if (createBandDto.assignedResidentId) {
      const resident = await this.residentRepository.findOne({
        where: { id: createBandDto.assignedResidentId, isDeleted: false },
      });
      if (!resident) {
        throw new NotFoundException(
          `Resident #${createBandDto.assignedResidentId} not found.`,
        );
      }
    }

    const band = this.bandRepository.create({
      ...createBandDto,
      status: createBandDto.assignedResidentId
        ? BandStatus.ACTIVE
        : createBandDto.status || BandStatus.AVAILABLE,
      lastSeenAt: new Date(),
    });

    return await this.bandRepository.save(band);
  }

  async update(id: number, updateBandDto: UpdateBandDto): Promise<Band> {
    const band = await this.findOne(id);

    if (updateBandDto.assignedResidentId !== undefined) {
      if (updateBandDto.assignedResidentId === null) {
        band.assignedResidentId = null;
        band.status = BandStatus.AVAILABLE;
      } else {
        const resident = await this.residentRepository.findOne({
          where: { id: updateBandDto.assignedResidentId, isDeleted: false },
        });
        if (!resident) {
          throw new NotFoundException(
            `Resident #${updateBandDto.assignedResidentId} not found.`,
          );
        }
        band.assignedResidentId = updateBandDto.assignedResidentId;
        band.status = BandStatus.ACTIVE;
      }
    }

    Object.assign(band, updateBandDto);
    band.updatedAt = new Date();

    return await this.bandRepository.save(band);
  }

  async assignToResident(bandId: number, residentId: number | null): Promise<Band> {
    const band = await this.findOne(bandId);

    if (residentId === null || residentId === undefined) {
      band.assignedResidentId = null;
      band.status = BandStatus.AVAILABLE;
    } else {
      const resident = await this.residentRepository.findOne({
        where: { id: residentId, isDeleted: false },
      });
      if (!resident) {
        throw new NotFoundException(`Resident with ID #${residentId} not found.`);
      }
      band.assignedResidentId = residentId;
      band.status = BandStatus.ACTIVE;
      band.isWorn = true;
    }

    band.updatedAt = new Date();
    await this.bandRepository.save(band);

    return await this.findOne(bandId);
  }

  async unassignFromResident(bandId: number): Promise<Band> {
    return await this.assignToResident(bandId, null);
  }

  async remove(id: number): Promise<boolean> {
    const band = await this.findOne(id);
    band.isDeleted = true;
    band.assignedResidentId = null;
    band.status = BandStatus.MAINTENANCE;
    band.updatedAt = new Date();
    await this.bandRepository.save(band);
    return true;
  }
}
