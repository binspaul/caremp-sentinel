import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DigitalTwin } from './entities/digital-twin.entity';
import { Resident } from 'src/residents/entities/resident.entity';

import { CreateDigitalTwinDto } from './dtos/create-digital-twin.dto';

@Injectable()
export class DigitalTwinService {
  private readonly logger = new Logger(DigitalTwinService.name);

  constructor(
    @InjectRepository(DigitalTwin)
    private readonly digitalTwinRepository: Repository<DigitalTwin>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) { }

  async findByResidentId(residentId: number): Promise<DigitalTwin | null> {
    const digitalTwin = await this.digitalTwinRepository.findOne({
      where: { residentId },
    });

    return digitalTwin;
  }

  async create(createDigitalTwinDto: CreateDigitalTwinDto): Promise<DigitalTwin> {
    const {
      residentId,
      identity,
      body,
      physiology,
      baselines,
      trends,
      correlations,
      healthInsights,
      healthRecords,
      metadata,
      aiSummary
    } = createDigitalTwinDto;

    const resident = await this.residentRepository.findOne({
      where: { id: residentId, isDeleted: false },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const twinData = {
      residentId,
      identity: identity
        ? {
          firstName: identity.firstName,
          lastName: identity.lastName,
          age: identity.age,
          gender: identity.gender,
        }
        : {},
      body: body
        ? {
          heightCm: body.heightCm,
          weightKg: body.weightKg,
          bmi: body.bmi,
          bloodGroup: body.bloodGroup,
        }
        : {},
      physiology: physiology
        ? {
          heartRate: physiology.heartRate,
          hrv: physiology.hrv,
          systolicBP: physiology.systolicBP,
          diastolicBP: physiology.diastolicBP,
          bodyTemperature: physiology.bodyTemperature,
          steps: physiology.steps,
          sleep: physiology.sleep,
        }
        : {},
      baselines: baselines
        ? {
          heartRate: baselines.heartRate,
          hrv: baselines.hrv,
          spo2: baselines.spo2,
          systolicBP: baselines.systolicBP,
          diastolicBP: baselines.diastolicBP,
          bodyTemperature: baselines.bodyTemperature,
          sleep: baselines.sleep
            ? {
              deep: baselines.sleep.deep,
              light: baselines.sleep.light,
              rem: baselines.sleep.rem,
              totalDuration: baselines.sleep.totalDuration,
            }
            : {},
        }
        : {},
      trends: trends || [],
      correlations: correlations || [],
      healthInsights: healthInsights
        ? {
          ...healthInsights,
          sundowning: healthInsights.sundowning || undefined,
          wandering: healthInsights.wandering || undefined,
          circadian: healthInsights.circadian || undefined,
          deterioration: healthInsights.deterioration || undefined,
          predictions: healthInsights.predictions || [],
          recommendations: healthInsights.recommendations || [],
        }
        : {},
      healthRecords: healthRecords
        ? healthRecords.map((hr) => ({
          ...hr,
          date: new Date(hr.date),
        }))
        : [],
      metadata: metadata
        ? {
          createdAt: new Date(metadata.createdAt),
          updatedAt: new Date(metadata.updatedAt),
          twinVersion: metadata.twinVersion,
        }
        : {},
      aiSummary,
    };

    let digitalTwin = await this.findByResidentId(residentId);

    if (digitalTwin) {
      Object.assign(digitalTwin, twinData);
    } else {
      digitalTwin = this.digitalTwinRepository.create(twinData);
    }

    return this.digitalTwinRepository.save(digitalTwin);
  }
}
