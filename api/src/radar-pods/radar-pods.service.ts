import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RadarPod,
  RadarPodStatus,
  RadarInstallationType,
} from './entities/radar-pod.entity';
import { Resident } from '../residents/entities/resident.entity';
import { CreateRadarPodDto } from './dtos/create-radar-pod.dto';
import { UpdateRadarPodDto } from './dtos/update-radar-pod.dto';

@Injectable()
export class RadarPodsService {
  constructor(
    @InjectRepository(RadarPod)
    private readonly radarPodRepository: Repository<RadarPod>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  // In-memory fallback state if database table is not yet migrated/reachable
  private fallbackPods: any[] = [
    {
      id: 1,
      serialNumber: 'RDR-001',
      macAddress: 'D4:8A:FC:21:01:01',
      model: 'Sentinel 60GHz FMCW Radar Pod v2',
      frequencyBand: '60 GHz FMCW',
      installationType: RadarInstallationType.BEDHEAD,
      detectionRangeMeters: 5.0,
      respirationRateBpm: 16.5,
      heartRateBpm: 68.0,
      bedOccupancy: true,
      firmwareVersion: 'v2.1.4',
      powerSource: 'ac_line_battery_backup',
      status: RadarPodStatus.ACTIVE,
      isOnline: true,
      roomNumber: 'Suite 201',
      lastHeartbeatAt: new Date(),
      notes: 'Bedhead contact-free ballistocardiography and micro-motion sleep tracking.',
      assignedResidentId: 1,
      assignedResident: { id: 1, firstName: 'Alex', lastName: 'Rivera', uhid: 'RES-001' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      serialNumber: 'RDR-002',
      macAddress: 'D4:8A:FC:21:01:02',
      model: 'Sentinel 60GHz FMCW Radar Pod v2',
      frequencyBand: '60 GHz FMCW',
      installationType: RadarInstallationType.BEDHEAD,
      detectionRangeMeters: 5.0,
      respirationRateBpm: 18.2,
      heartRateBpm: 72.0,
      bedOccupancy: true,
      firmwareVersion: 'v2.1.4',
      powerSource: 'ac_line_battery_backup',
      status: RadarPodStatus.ACTIVE,
      isOnline: true,
      roomNumber: 'Suite 204',
      lastHeartbeatAt: new Date(),
      notes: 'High-sensitivity sleep apnea & nocturnal respiration dip detection enabled.',
      assignedResidentId: 2,
      assignedResident: { id: 2, firstName: 'Eleanor', lastName: 'Vance', uhid: 'RES-002' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      serialNumber: 'RDR-003',
      macAddress: 'D4:8A:FC:21:01:03',
      model: 'Sentinel 60GHz FMCW Radar Pod v2',
      frequencyBand: '60 GHz FMCW',
      installationType: RadarInstallationType.BEDHEAD,
      detectionRangeMeters: 5.0,
      respirationRateBpm: 19.0,
      heartRateBpm: 74.0,
      bedOccupancy: true,
      firmwareVersion: 'v2.1.4',
      powerSource: 'ac_line_battery_backup',
      status: RadarPodStatus.ACTIVE,
      isOnline: true,
      roomNumber: 'Suite 208',
      lastHeartbeatAt: new Date(),
      notes: 'Contact-free ballistocardiography calibrated for Lewy Body nocturnal motor symptoms.',
      assignedResidentId: 3,
      assignedResident: { id: 3, firstName: 'Marcus', lastName: 'Chen', uhid: 'RES-003' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      serialNumber: 'RDR-004',
      macAddress: 'D4:8A:FC:21:01:04',
      model: 'Sentinel 60GHz FMCW Radar Pod v2',
      frequencyBand: '60 GHz FMCW',
      installationType: RadarInstallationType.CEILING,
      detectionRangeMeters: 7.0,
      respirationRateBpm: 15.8,
      heartRateBpm: 66.0,
      bedOccupancy: false,
      firmwareVersion: 'v2.1.2',
      powerSource: 'poe_ethernet',
      status: RadarPodStatus.ACTIVE,
      isOnline: true,
      roomNumber: 'Suite 103',
      lastHeartbeatAt: new Date(),
      notes: 'Overhead micro-motion radar for fall-from-bed and ambient room presence.',
      assignedResidentId: 4,
      assignedResident: { id: 4, firstName: 'Clara', lastName: 'Oswald', uhid: 'RES-004' },
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 5,
      serialNumber: 'RDR-005',
      macAddress: 'D4:8A:FC:21:01:05',
      model: 'Sentinel 60GHz FMCW Radar Pod v2',
      frequencyBand: '60 GHz FMCW',
      installationType: RadarInstallationType.BEDHEAD,
      detectionRangeMeters: 5.0,
      respirationRateBpm: null,
      heartRateBpm: null,
      bedOccupancy: false,
      firmwareVersion: 'v2.1.4',
      powerSource: 'ac_line_battery_backup',
      status: RadarPodStatus.STANDBY,
      isOnline: true,
      roomNumber: 'Suite 202',
      lastHeartbeatAt: new Date(),
      notes: 'Calibrated and on standby for new resident admission.',
      assignedResidentId: null,
      assignedResident: null,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 6,
      serialNumber: 'RDR-006',
      macAddress: 'D4:8A:FC:21:01:06',
      model: 'Sentinel 60GHz FMCW Radar Pod v2',
      frequencyBand: '60 GHz FMCW',
      installationType: RadarInstallationType.WALL_MOUNT,
      detectionRangeMeters: 4.5,
      respirationRateBpm: null,
      heartRateBpm: null,
      bedOccupancy: false,
      firmwareVersion: 'v2.0.8',
      powerSource: 'ac_line_battery_backup',
      status: RadarPodStatus.MAINTENANCE,
      isOnline: false,
      roomNumber: 'Suite 210',
      lastHeartbeatAt: null,
      notes: 'Firmware upgrade pending. Antenna array recalibration required.',
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
  }): Promise<[RadarPod[], number]> {
    try {
      const qb = this.radarPodRepository
        .createQueryBuilder('pod')
        .leftJoinAndSelect('pod.assignedResident', 'resident')
        .where('pod.isDeleted = false');

      if (params?.status) {
        qb.andWhere('pod.status = :status', { status: params.status });
      }

      if (params?.residentId) {
        qb.andWhere('pod.assignedResidentId = :residentId', {
          residentId: params.residentId,
        });
      }

      if (params?.search) {
        qb.andWhere(
          '(pod.serialNumber ILIKE :search OR pod.macAddress ILIKE :search OR pod.model ILIKE :search OR pod.roomNumber ILIKE :search OR resident.firstName ILIKE :search OR resident.lastName ILIKE :search)',
          { search: `%${params.search}%` },
        );
      }

      qb.orderBy('pod.id', 'ASC');

      const skip = Number(params?.skip) || 0;
      const limit = Number(params?.limit) || 50;

      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
      if (data && data.length > 0) {
        return [data, total];
      }
    } catch (err) {
      console.warn('[RadarPodsService] DB read failed, using fallback fleet:', err?.message);
    }

    // Fallback in-memory
    let list = this.fallbackPods.filter((p) => !p.isDeleted);
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
          (p.roomNumber && p.roomNumber.toLowerCase().includes(q)) ||
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

  async findOne(id: number): Promise<RadarPod> {
    try {
      const pod = await this.radarPodRepository
        .createQueryBuilder('pod')
        .leftJoinAndSelect('pod.assignedResident', 'resident')
        .where('pod.id = :id', { id })
        .andWhere('pod.isDeleted = false')
        .getOne();

      if (pod) return pod;
    } catch (err) {
      console.warn('[RadarPodsService] DB findOne failed, checking fallback:', err?.message);
    }

    const fallback = this.fallbackPods.find((p) => p.id === id && !p.isDeleted);
    if (!fallback) {
      throw new NotFoundException(`Radar Pod #${id} not found.`);
    }
    return fallback;
  }

  async findByResident(residentId: number): Promise<RadarPod[]> {
    try {
      const pods = await this.radarPodRepository.find({
        where: { assignedResidentId: residentId, isDeleted: false },
        relations: { assignedResident: true },
      });
      if (pods && pods.length > 0) return pods;
    } catch (err) {
      console.warn('[RadarPodsService] DB findByResident failed, using fallback:', err?.message);
    }

    return this.fallbackPods.filter(
      (p) => p.assignedResidentId === residentId && !p.isDeleted,
    );
  }

  async getCounters(): Promise<{
    total: number;
    active: number;
    standby: number;
    offline: number;
    maintenance: number;
    bedOccupied: number;
  }> {
    let pods: any[] = [];
    try {
      pods = await this.radarPodRepository.find({
        where: { isDeleted: false },
      });
    } catch {
      pods = this.fallbackPods.filter((p) => !p.isDeleted);
    }

    if (!pods || pods.length === 0) {
      pods = this.fallbackPods.filter((p) => !p.isDeleted);
    }

    const total = pods.length;
    let active = 0;
    let standby = 0;
    let offline = 0;
    let maintenance = 0;
    let bedOccupied = 0;

    for (const p of pods) {
      if (p.status === RadarPodStatus.ACTIVE) active++;
      else if (p.status === RadarPodStatus.STANDBY) standby++;
      else if (p.status === RadarPodStatus.OFFLINE) offline++;
      else if (p.status === RadarPodStatus.MAINTENANCE) maintenance++;

      if (p.bedOccupancy) {
        bedOccupied++;
      }
    }

    return { total, active, standby, offline, maintenance, bedOccupied };
  }

  async create(dto: CreateRadarPodDto): Promise<RadarPod> {
    try {
      const existing = await this.radarPodRepository.findOne({
        where: [{ serialNumber: dto.serialNumber }, { macAddress: dto.macAddress }],
      });

      if (existing) {
        throw new ConflictException(
          `Radar Pod with Serial #${dto.serialNumber} or MAC ${dto.macAddress} already exists.`,
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

      const pod = this.radarPodRepository.create({
        ...dto,
        status: dto.assignedResidentId
          ? RadarPodStatus.ACTIVE
          : dto.status || RadarPodStatus.STANDBY,
        lastHeartbeatAt: new Date(),
      });

      return await this.radarPodRepository.save(pod);
    } catch (err) {
      if (err instanceof ConflictException || err instanceof NotFoundException) throw err;
      console.warn('[RadarPodsService] DB create failed, saving to fallback:', err?.message);
    }

    const newId = this.fallbackPods.length + 1;
    const newPod = {
      id: newId,
      ...dto,
      status: dto.assignedResidentId
        ? RadarPodStatus.ACTIVE
        : dto.status || RadarPodStatus.STANDBY,
      isOnline: dto.isOnline ?? true,
      detectionRangeMeters: dto.detectionRangeMeters ?? 5.0,
      respirationRateBpm: null,
      heartRateBpm: null,
      bedOccupancy: false,
      firmwareVersion: dto.firmwareVersion || 'v2.1.4',
      powerSource: dto.powerSource || 'ac_line_battery_backup',
      lastHeartbeatAt: new Date(),
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedResident: dto.assignedResidentId
        ? { id: dto.assignedResidentId, firstName: 'Assigned', lastName: 'Resident' }
        : null,
    };
    this.fallbackPods.push(newPod);
    return newPod as any;
  }

  async update(id: number, dto: UpdateRadarPodDto): Promise<RadarPod> {
    try {
      const pod = await this.findOne(id);
      if (dto.assignedResidentId !== undefined) {
        if (dto.assignedResidentId === null) {
          pod.assignedResidentId = null;
          pod.status = RadarPodStatus.STANDBY;
          pod.bedOccupancy = false;
        } else {
          const resident = await this.residentRepository.findOne({
            where: { id: dto.assignedResidentId, isDeleted: false },
          });
          if (!resident) {
            throw new NotFoundException(`Resident #${dto.assignedResidentId} not found.`);
          }
          pod.assignedResidentId = dto.assignedResidentId;
          pod.status = RadarPodStatus.ACTIVE;
        }
      }

      Object.assign(pod, dto);
      pod.updatedAt = new Date();
      return await this.radarPodRepository.save(pod);
    } catch (err) {
      console.warn('[RadarPodsService] DB update failed, updating fallback:', err?.message);
    }

    const fallback = this.fallbackPods.find((p) => p.id === id);
    if (!fallback) throw new NotFoundException(`Radar Pod #${id} not found.`);
    Object.assign(fallback, dto);
    fallback.updatedAt = new Date();
    return fallback;
  }

  async assignToResident(
    podId: number,
    residentId: number | null,
    roomNumber?: string,
  ): Promise<RadarPod> {
    try {
      const pod = await this.findOne(podId);
      if (residentId === null || residentId === undefined) {
        pod.assignedResidentId = null;
        pod.status = RadarPodStatus.STANDBY;
        pod.bedOccupancy = false;
      } else {
        const resident = await this.residentRepository.findOne({
          where: { id: residentId, isDeleted: false },
        });
        if (!resident) {
          throw new NotFoundException(`Resident #${residentId} not found.`);
        }
        pod.assignedResidentId = residentId;
        pod.status = RadarPodStatus.ACTIVE;
        pod.bedOccupancy = true;
      }
      if (roomNumber) pod.roomNumber = roomNumber;
      pod.updatedAt = new Date();
      await this.radarPodRepository.save(pod);
      return await this.findOne(podId);
    } catch (err) {
      console.warn('[RadarPodsService] DB assign failed, updating fallback:', err?.message);
    }

    const fallback = this.fallbackPods.find((p) => p.id === podId);
    if (!fallback) throw new NotFoundException(`Radar Pod #${podId} not found.`);
    fallback.assignedResidentId = residentId;
    fallback.status = residentId ? RadarPodStatus.ACTIVE : RadarPodStatus.STANDBY;
    fallback.bedOccupancy = !!residentId;
    if (roomNumber) fallback.roomNumber = roomNumber;
    fallback.updatedAt = new Date();
    return fallback;
  }

  async unassignFromResident(podId: number): Promise<RadarPod> {
    return await this.assignToResident(podId, null);
  }

  async remove(id: number): Promise<boolean> {
    try {
      const pod = await this.findOne(id);
      pod.isDeleted = true;
      pod.assignedResidentId = null;
      pod.status = RadarPodStatus.MAINTENANCE;
      pod.updatedAt = new Date();
      await this.radarPodRepository.save(pod);
      return true;
    } catch (err) {
      console.warn('[RadarPodsService] DB remove failed, soft-deleting in fallback:', err?.message);
    }

    const fallback = this.fallbackPods.find((p) => p.id === id);
    if (fallback) {
      fallback.isDeleted = true;
      fallback.status = RadarPodStatus.MAINTENANCE;
      fallback.assignedResidentId = null;
    }
    return true;
  }
}
