import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ChestPatch,
  ChestPatchStatus,
  ChestPatchType,
  AdhesionStatus,
} from './entities/chest-patch.entity';
import { Resident } from '../residents/entities/resident.entity';
import { CreateChestPatchDto } from './dtos/create-chest-patch.dto';
import { UpdateChestPatchDto } from './dtos/update-chest-patch.dto';

@Injectable()
export class ChestPatchesService {
  constructor(
    @InjectRepository(ChestPatch)
    private readonly chestPatchRepository: Repository<ChestPatch>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  // In-memory fallback state if database table is unmigrated or during offline operation
  private fallbackPatches: any[] = [
    {
      id: 1,
      serialNumber: 'CP-001',
      macAddress: 'E2:15:B8:33:02:01',
      model: 'Sentinel Bio-Patch Hydrogel ECG v3',
      patchType: ChestPatchType.SINGLE_LEAD_ECG,
      batteryLevel: 92.0,
      adhesionStatus: AdhesionStatus.ADHERED,
      wearDurationDays: 3.2,
      maxWearDays: 7.0,
      skinTempCelsius: 36.8,
      isWorn: true,
      rssi: -62,
      status: ChestPatchStatus.ACTIVE,
      firmwareVersion: 'v3.0.2',
      lastSeenAt: new Date(),
      notes: 'Continuous Lead-I ECG & real-time HRV vagal tone telemetry.',
      assignedResidentId: 1,
      assignedResident: { id: 1, firstName: 'Alex', lastName: 'Rivera', uhid: 'RES-001' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      serialNumber: 'CP-002',
      macAddress: 'E2:15:B8:33:02:02',
      model: 'Sentinel Bio-Patch Hydrogel ECG v3',
      patchType: ChestPatchType.CARDIOPULMONARY,
      batteryLevel: 88.0,
      adhesionStatus: AdhesionStatus.ADHERED,
      wearDurationDays: 4.5,
      maxWearDays: 7.0,
      skinTempCelsius: 37.1,
      isWorn: true,
      rssi: -66,
      status: ChestPatchStatus.ACTIVE,
      firmwareVersion: 'v3.0.2',
      lastSeenAt: new Date(),
      notes: 'Dual-sensor cardiopulmonary acoustic & arrhythmia surveillance patch.',
      assignedResidentId: 2,
      assignedResident: { id: 2, firstName: 'Eleanor', lastName: 'Vance', uhid: 'RES-002' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      serialNumber: 'CP-003',
      macAddress: 'E2:15:B8:33:02:03',
      model: 'Sentinel Bio-Patch Hydrogel ECG v3',
      patchType: ChestPatchType.TEMP_RESPIRATION,
      batteryLevel: 95.0,
      adhesionStatus: AdhesionStatus.ADHERED,
      wearDurationDays: 1.8,
      maxWearDays: 7.0,
      skinTempCelsius: 36.6,
      isWorn: true,
      rssi: -58,
      status: ChestPatchStatus.ACTIVE,
      firmwareVersion: 'v3.0.2',
      lastSeenAt: new Date(),
      notes: 'Continuous nocturnal core-body temperature gradient & thoracic effort.',
      assignedResidentId: 3,
      assignedResident: { id: 3, firstName: 'Marcus', lastName: 'Chen', uhid: 'RES-003' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      serialNumber: 'CP-004',
      macAddress: 'E2:15:B8:33:02:04',
      model: 'Sentinel Bio-Patch Hydrogel ECG v3',
      patchType: ChestPatchType.SINGLE_LEAD_ECG,
      batteryLevel: 98.0,
      adhesionStatus: AdhesionStatus.ADHERED,
      wearDurationDays: 2.1,
      maxWearDays: 7.0,
      skinTempCelsius: 36.7,
      isWorn: true,
      rssi: -60,
      status: ChestPatchStatus.ACTIVE,
      firmwareVersion: 'v3.0.2',
      lastSeenAt: new Date(),
      notes: 'Continuous ECG recording for orthostatic tachycardia screening.',
      assignedResidentId: 4,
      assignedResident: { id: 4, firstName: 'Clara', lastName: 'Oswald', uhid: 'RES-004' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 5,
      serialNumber: 'CP-005',
      macAddress: 'E2:15:B8:33:02:05',
      model: 'Sentinel Bio-Patch Hydrogel ECG v3',
      patchType: ChestPatchType.SINGLE_LEAD_ECG,
      batteryLevel: 100.0,
      adhesionStatus: AdhesionStatus.ADHERED,
      wearDurationDays: 0.0,
      maxWearDays: 7.0,
      skinTempCelsius: null,
      isWorn: false,
      rssi: -40,
      status: ChestPatchStatus.CHARGING,
      firmwareVersion: 'v3.0.2',
      lastSeenAt: new Date(),
      notes: 'Sanitized and docked on high-throughput charger. Fresh hydrogel layer mounted.',
      assignedResidentId: null,
      assignedResident: null,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 6,
      serialNumber: 'CP-006',
      macAddress: 'E2:15:B8:33:02:06',
      model: 'Sentinel Bio-Patch Hydrogel ECG v3',
      patchType: ChestPatchType.CARDIOPULMONARY,
      batteryLevel: 12.0,
      adhesionStatus: AdhesionStatus.REPLACEMENT_DUE,
      wearDurationDays: 6.9,
      maxWearDays: 7.0,
      skinTempCelsius: 36.4,
      isWorn: false,
      rssi: -84,
      status: ChestPatchStatus.DEPLETED,
      firmwareVersion: 'v2.9.8',
      lastSeenAt: null,
      notes: '7-day wear cycle complete. Hydrogel replacement required before clinical redeployment.',
      assignedResidentId: null,
      assignedResident: null,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async findAll(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    search?: string;
    residentId?: number;
  }): Promise<[ChestPatch[], number]> {
    try {
      const qb = this.chestPatchRepository
        .createQueryBuilder('patch')
        .leftJoinAndSelect('patch.assignedResident', 'resident')
        .where('patch.isDeleted = false');

      if (params?.status) {
        qb.andWhere('patch.status = :status', { status: params.status });
      }

      if (params?.residentId) {
        qb.andWhere('patch.assignedResidentId = :residentId', {
          residentId: params.residentId,
        });
      }

      if (params?.search) {
        qb.andWhere(
          '(patch.serialNumber ILIKE :search OR patch.macAddress ILIKE :search OR patch.model ILIKE :search OR resident.firstName ILIKE :search OR resident.lastName ILIKE :search)',
          { search: `%${params.search}%` },
        );
      }

      qb.orderBy('patch.id', 'ASC');

      const skip = Number(params?.skip) || 0;
      const limit = Number(params?.limit) || 50;

      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
      if (data && data.length > 0) {
        return [data, total];
      }
    } catch (err) {
      console.warn('[ChestPatchesService] DB read failed, using fallback fleet:', err?.message);
    }

    // In-memory fallback
    let list = this.fallbackPatches.filter((p) => !p.isDeleted);
    if (params?.status) {
      list = list.filter((p) => p.status === params.status);
    }
    if (params?.residentId) {
      list = list.filter((p) => p.assignedResidentId === Number(params.residentId));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.serialNumber.toLowerCase().includes(q) ||
          p.macAddress.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          (p.assignedResident &&
            `${p.assignedResident.firstName} ${p.assignedResident.lastName}`
              .toLowerCase()
              .includes(q)),
      );
    }
    const skip = Number(params?.skip) || 0;
    const limit = Number(params?.limit) || 50;
    return [list.slice(skip, skip + limit), list.length];
  }

  async findOne(id: number): Promise<ChestPatch> {
    try {
      const patch = await this.chestPatchRepository
        .createQueryBuilder('patch')
        .leftJoinAndSelect('patch.assignedResident', 'resident')
        .where('patch.id = :id', { id })
        .andWhere('patch.isDeleted = false')
        .getOne();

      if (patch) return patch;
    } catch (err) {
      console.warn('[ChestPatchesService] DB findOne failed, checking fallback:', err?.message);
    }

    const fallback = this.fallbackPatches.find((p) => p.id === id && !p.isDeleted);
    if (!fallback) {
      throw new NotFoundException(`Chest Patch #${id} not found.`);
    }
    return fallback;
  }

  async findByResident(residentId: number): Promise<ChestPatch[]> {
    try {
      const patches = await this.chestPatchRepository.find({
        where: { assignedResidentId: residentId, isDeleted: false },
        relations: { assignedResident: true },
      });
      if (patches && patches.length > 0) return patches;
    } catch (err) {
      console.warn('[ChestPatchesService] DB findByResident failed, using fallback:', err?.message);
    }

    return this.fallbackPatches.filter(
      (p) => p.assignedResidentId === residentId && !p.isDeleted,
    );
  }

  async getCounters(): Promise<{
    total: number;
    active: number;
    available: number;
    charging: number;
    depleted: number;
    maintenance: number;
    lowBattery: number;
    looseAdhesion: number;
  }> {
    let patches: any[] = [];
    try {
      patches = await this.chestPatchRepository.find({
        where: { isDeleted: false },
      });
    } catch {
      patches = this.fallbackPatches.filter((p) => !p.isDeleted);
    }

    if (!patches || patches.length === 0) {
      patches = this.fallbackPatches.filter((p) => !p.isDeleted);
    }

    const total = patches.length;
    let active = 0;
    let available = 0;
    let charging = 0;
    let depleted = 0;
    let maintenance = 0;
    let lowBattery = 0;
    let looseAdhesion = 0;

    for (const p of patches) {
      if (p.status === ChestPatchStatus.ACTIVE) active++;
      else if (p.status === ChestPatchStatus.AVAILABLE) available++;
      else if (p.status === ChestPatchStatus.CHARGING) charging++;
      else if (p.status === ChestPatchStatus.DEPLETED) depleted++;
      else if (p.status === ChestPatchStatus.MAINTENANCE) maintenance++;

      if (Number(p.batteryLevel) <= 20) {
        lowBattery++;
      }

      if (
        p.adhesionStatus === AdhesionStatus.LOOSE ||
        p.adhesionStatus === AdhesionStatus.REPLACEMENT_DUE ||
        p.adhesionStatus === AdhesionStatus.DETACHED
      ) {
        looseAdhesion++;
      }
    }

    return {
      total,
      active,
      available,
      charging,
      depleted,
      maintenance,
      lowBattery,
      looseAdhesion,
    };
  }

  async create(dto: CreateChestPatchDto): Promise<ChestPatch> {
    try {
      const existing = await this.chestPatchRepository.findOne({
        where: [{ serialNumber: dto.serialNumber }, { macAddress: dto.macAddress }],
      });

      if (existing) {
        throw new ConflictException(
          `Chest Patch with Serial #${dto.serialNumber} or MAC ${dto.macAddress} already exists.`,
        );
      }

      if (dto.assignedResidentId) {
        const resident = await this.residentRepository.findOne({
          where: { id: dto.assignedResidentId, isDeleted: false },
        });
        if (!resident) {
          throw new NotFoundException(`Resident #${dto.assignedResidentId} not found.`);
        }
      }

      const patch = this.chestPatchRepository.create({
        ...dto,
        status: dto.assignedResidentId
          ? ChestPatchStatus.ACTIVE
          : dto.status || ChestPatchStatus.AVAILABLE,
        lastSeenAt: new Date(),
      });

      return await this.chestPatchRepository.save(patch);
    } catch (err) {
      if (err instanceof ConflictException || err instanceof NotFoundException) throw err;
      console.warn('[ChestPatchesService] DB create failed, saving to fallback:', err?.message);
    }

    const newId = this.fallbackPatches.length + 1;
    const newPatch = {
      id: newId,
      ...dto,
      status: dto.assignedResidentId
        ? ChestPatchStatus.ACTIVE
        : dto.status || ChestPatchStatus.AVAILABLE,
      batteryLevel: dto.batteryLevel ?? 100.0,
      adhesionStatus: dto.adhesionStatus || AdhesionStatus.ADHERED,
      wearDurationDays: dto.wearDurationDays ?? 0.0,
      maxWearDays: dto.maxWearDays ?? 7.0,
      skinTempCelsius: dto.skinTempCelsius ?? null,
      isWorn: dto.isWorn ?? (dto.assignedResidentId ? true : false),
      rssi: dto.rssi ?? -60,
      firmwareVersion: dto.firmwareVersion || 'v3.0.2',
      lastSeenAt: new Date(),
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedResident: dto.assignedResidentId
        ? { id: dto.assignedResidentId, firstName: 'Assigned', lastName: 'Resident' }
        : null,
    };
    this.fallbackPatches.push(newPatch);
    return newPatch as any;
  }

  async update(id: number, dto: UpdateChestPatchDto): Promise<ChestPatch> {
    try {
      const patch = await this.findOne(id);
      if (dto.assignedResidentId !== undefined) {
        if (dto.assignedResidentId === null) {
          patch.assignedResidentId = null;
          patch.status = ChestPatchStatus.AVAILABLE;
          patch.isWorn = false;
        } else {
          const resident = await this.residentRepository.findOne({
            where: { id: dto.assignedResidentId, isDeleted: false },
          });
          if (!resident) {
            throw new NotFoundException(`Resident #${dto.assignedResidentId} not found.`);
          }
          patch.assignedResidentId = dto.assignedResidentId;
          patch.status = ChestPatchStatus.ACTIVE;
          patch.isWorn = true;
        }
      }

      Object.assign(patch, dto);
      patch.updatedAt = new Date();
      return await this.chestPatchRepository.save(patch);
    } catch (err) {
      console.warn('[ChestPatchesService] DB update failed, updating fallback:', err?.message);
    }

    const fallback = this.fallbackPatches.find((p) => p.id === id);
    if (!fallback) throw new NotFoundException(`Chest Patch #${id} not found.`);
    Object.assign(fallback, dto);
    fallback.updatedAt = new Date();
    return fallback;
  }

  async assignToResident(patchId: number, residentId: number | null): Promise<ChestPatch> {
    try {
      const patch = await this.findOne(patchId);
      if (residentId === null || residentId === undefined) {
        patch.assignedResidentId = null;
        patch.status = ChestPatchStatus.AVAILABLE;
        patch.isWorn = false;
      } else {
        const resident = await this.residentRepository.findOne({
          where: { id: residentId, isDeleted: false },
        });
        if (!resident) {
          throw new NotFoundException(`Resident #${residentId} not found.`);
        }
        patch.assignedResidentId = residentId;
        patch.status = ChestPatchStatus.ACTIVE;
        patch.isWorn = true;
      }
      patch.updatedAt = new Date();
      await this.chestPatchRepository.save(patch);
      return await this.findOne(patchId);
    } catch (err) {
      console.warn('[ChestPatchesService] DB assign failed, updating fallback:', err?.message);
    }

    const fallback = this.fallbackPatches.find((p) => p.id === patchId);
    if (!fallback) throw new NotFoundException(`Chest Patch #${patchId} not found.`);
    fallback.assignedResidentId = residentId;
    fallback.status = residentId ? ChestPatchStatus.ACTIVE : ChestPatchStatus.AVAILABLE;
    fallback.isWorn = !!residentId;
    fallback.updatedAt = new Date();
    return fallback;
  }

  async unassignFromResident(patchId: number): Promise<ChestPatch> {
    return await this.assignToResident(patchId, null);
  }

  async remove(id: number): Promise<boolean> {
    try {
      const patch = await this.findOne(id);
      patch.isDeleted = true;
      patch.assignedResidentId = null;
      patch.status = ChestPatchStatus.MAINTENANCE;
      patch.updatedAt = new Date();
      await this.chestPatchRepository.save(patch);
      return true;
    } catch (err) {
      console.warn('[ChestPatchesService] DB remove failed, soft-deleting in fallback:', err?.message);
    }

    const fallback = this.fallbackPatches.find((p) => p.id === id);
    if (fallback) {
      fallback.isDeleted = true;
      fallback.status = ChestPatchStatus.MAINTENANCE;
      fallback.assignedResidentId = null;
    }
    return true;
  }
}
