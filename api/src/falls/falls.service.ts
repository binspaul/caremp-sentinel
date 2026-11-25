import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FallIncident,
  FallIncidentStatus,
  FallSeverity,
} from './entities/fall-incident.entity';
import { Resident } from '../residents/entities/resident.entity';
import { Band } from '../bands/entities/band.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../notifications/entities/notification.entity';
import { CreateFallIncidentDto } from './dtos/create-fall-incident.dto';
import { ResolveFallIncidentDto } from './dtos/resolve-fall-incident.dto';

@Injectable()
export class FallsService {
  private readonly logger = new Logger(FallsService.name);

  constructor(
    @InjectRepository(FallIncident)
    private readonly fallRepository: Repository<FallIncident>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,

    @InjectRepository(Band)
    private readonly bandRepository: Repository<Band>,

    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(params?: {
    skip?: number;
    limit?: number;
    residentId?: number;
    status?: string;
  }): Promise<[FallIncident[], number]> {
    const qb = this.fallRepository
      .createQueryBuilder('fall')
      .leftJoinAndSelect('fall.resident', 'resident')
      .leftJoinAndSelect('fall.band', 'band')
      .where('fall.isDeleted = false');

    if (params?.residentId) {
      qb.andWhere('fall.residentId = :residentId', {
        residentId: params.residentId,
      });
    }

    if (params?.status) {
      qb.andWhere('fall.status = :status', { status: params.status });
    }

    qb.orderBy('fall.detectedAt', 'DESC');

    const skip = Number(params?.skip) || 0;
    const limit = Number(params?.limit) || 50;

    return await qb.skip(skip).take(limit).getManyAndCount();
  }

  async findOne(id: number): Promise<FallIncident> {
    const incident = await this.fallRepository
      .createQueryBuilder('fall')
      .leftJoinAndSelect('fall.resident', 'resident')
      .leftJoinAndSelect('fall.band', 'band')
      .where('fall.id = :id', { id })
      .andWhere('fall.isDeleted = false')
      .getOne();

    if (!incident) {
      throw new NotFoundException(`Fall incident with ID #${id} not found.`);
    }

    return incident;
  }

  async findLatestUnresolved(residentId?: number): Promise<FallIncident | null> {
    const qb = this.fallRepository
      .createQueryBuilder('fall')
      .leftJoinAndSelect('fall.resident', 'resident')
      .leftJoinAndSelect('fall.band', 'band')
      .where('fall.isDeleted = false')
      .andWhere('fall.status = :status', {
        status: FallIncidentStatus.UNRESOLVED,
      });

    if (residentId) {
      qb.andWhere('fall.residentId = :residentId', { residentId });
    }

    qb.orderBy('fall.detectedAt', 'DESC');

    return await qb.getOne();
  }

  async getCounters(): Promise<{
    total: number;
    unresolved: number;
    emergencyDispatched: number;
    resolvedFalseAlarm: number;
    resolvedAssisted: number;
  }> {
    const incidents = await this.fallRepository.find({
      where: { isDeleted: false },
    });

    let unresolved = 0;
    let emergencyDispatched = 0;
    let resolvedFalseAlarm = 0;
    let resolvedAssisted = 0;

    for (const inc of incidents) {
      if (inc.status === FallIncidentStatus.UNRESOLVED) unresolved++;
      else if (inc.status === FallIncidentStatus.EMERGENCY_DISPATCHED)
        emergencyDispatched++;
      else if (inc.status === FallIncidentStatus.RESOLVED_FALSE_ALARM)
        resolvedFalseAlarm++;
      else if (inc.status === FallIncidentStatus.RESOLVED_ASSISTED)
        resolvedAssisted++;
    }

    return {
      total: incidents.length,
      unresolved,
      emergencyDispatched,
      resolvedFalseAlarm,
      resolvedAssisted,
    };
  }

  async create(dto: CreateFallIncidentDto): Promise<FallIncident> {
    const resident = await this.residentRepository.findOne({
      where: { id: dto.residentId, isDeleted: false },
    });

    if (!resident) {
      throw new NotFoundException(`Resident with ID #${dto.residentId} not found.`);
    }

    let bandId = dto.bandId || null;
    if (!bandId) {
      // Auto-associate with the resident's paired band if available
      const pairedBand = await this.bandRepository.findOne({
        where: { assignedResidentId: dto.residentId, isDeleted: false },
      });
      if (pairedBand) {
        bandId = pairedBand.id;
      }
    }

    const incident = this.fallRepository.create({
      residentId: dto.residentId,
      bandId,
      impactForceG: dto.impactForceG ?? 3.4,
      orientationChangeDeg: dto.orientationChangeDeg ?? 88.0,
      motionlessDurationSeconds: dto.motionlessDurationSeconds ?? 45,
      severity: dto.severity ?? FallSeverity.CRITICAL,
      status: dto.status ?? FallIncidentStatus.UNRESOLVED,
      location: dto.location ?? 'Bedroom Bedside',
      clinicalDescription:
        dto.clinicalDescription ??
        'Rapid kinematic deceleration spike followed by cessation of micro-motion.',
      detectedAt: new Date(),
    });

    const savedIncident = await this.fallRepository.save(incident);

    // Auto-create a Notification record for the simulated/detected fall incident
    try {
      const isCritical =
        savedIncident.severity === FallSeverity.CRITICAL ||
        savedIncident.severity === FallSeverity.SEVERE;

      const priority = isCritical
        ? NotificationPriority.CRITICAL
        : savedIncident.severity === FallSeverity.MODERATE
        ? NotificationPriority.HIGH
        : NotificationPriority.MEDIUM;

      const residentName = `${resident.firstName} ${resident.lastName}`.trim();
      const notification = this.notificationRepository.create({
        residentId: savedIncident.residentId,
        type: NotificationType.FALL,
        priority,
        title: 'Emergency Fall Alert Detected',
        message: `${savedIncident.severity.toUpperCase()} fall incident detected for ${residentName} at ${savedIncident.location}. Kinematic impact: ${savedIncident.impactForceG}g, motionless duration: ${savedIncident.motionlessDurationSeconds}s.`,
        data: {
          fallId: savedIncident.id,
          roomNumber: resident.roomNumber || undefined,
          location: savedIncident.location,
          impactG: savedIncident.impactForceG,
          motionlessSeconds: savedIncident.motionlessDurationSeconds,
          severity: savedIncident.severity,
          scenario: savedIncident.clinicalDescription,
        },
        isRead: false,
        isDismissed: false,
      });

      await this.notificationRepository.save(notification);
    } catch (notifError) {
      this.logger.error('Failed to auto-create notification for fall incident', notifError);
    }

    return savedIncident;
  }

  async resolve(id: number, dto: ResolveFallIncidentDto): Promise<FallIncident> {
    const incident = await this.findOne(id);

    incident.status = dto.status;
    incident.resolvedAt = new Date();
    incident.resolvedBy = dto.resolvedBy || 'Dr. Sarah Jenkins';
    incident.resolutionNotes = dto.resolutionNotes || 'Clinical evaluation completed via Telemedicine triage.';
    incident.updatedAt = new Date();

    return await this.fallRepository.save(incident);
  }
}
