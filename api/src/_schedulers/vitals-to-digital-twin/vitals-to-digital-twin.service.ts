import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DigitalTwin } from '../../digital-twin/entities/digital-twin.entity';
import { Resident } from '../../residents/entities/resident.entity';
import { Vital, TemperatureUnit } from '../../vitals/entities/vital.entity';

@Injectable()
export class VitalsToDigitalTwinService {
  private readonly logger = new Logger(VitalsToDigitalTwinService.name);

  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,

    @InjectRepository(Vital)
    private readonly vitalRepository: Repository<Vital>,

    @InjectRepository(DigitalTwin)
    private readonly digitalTwinRepository: Repository<DigitalTwin>,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncVitalsToDigitalTwin() {
    this.logger.log('Executing Vitals to Digital Twin Sync Scheduler...');

    try {
      const residents = await this.residentRepository.find({
        where: { isActive: true, isDeleted: false },
      });

      if (!residents || residents.length === 0) {
        this.logger.warn('No active residents found for digital twin vitals sync.');
        return;
      }

      let updatedCount = 0;
      let createdCount = 0;

      for (const resident of residents) {
        const latestVital = await this.vitalRepository.findOne({
          where: { residentId: resident.id, isDeleted: false },
          order: { generatedAt: 'DESC' },
        });

        if (!latestVital) {
          continue;
        }

        const currentPhysiology = {
          heartRate: {
            value: Number(latestVital.heartRate || 0),
            unit: 'bpm',
            timestamp: latestVital.generatedAt,
          },
          hrv: {
            value: Number(latestVital.hrv || 0),
            unit: 'ms',
            timestamp: latestVital.generatedAt,
          },
          spo2: {
            value: Number(latestVital.oxygenSaturation || 0),
            unit: '%',
            timestamp: latestVital.generatedAt,
          },
          systolicBP: {
            value: Number(latestVital.systolicBP || 0),
            unit: 'mmHg',
            timestamp: latestVital.generatedAt,
          },
          diastolicBP: {
            value: Number(latestVital.diastolicBP || 0),
            unit: 'mmHg',
            timestamp: latestVital.generatedAt,
          },
          bodyTemperature: {
            value: Number(latestVital.bodyTemperature || 0),
            unit: latestVital.temperatureUnit === TemperatureUnit.FAHRENHEIT ? '°F' : '°C',
            timestamp: latestVital.generatedAt,
          },
          steps: {
            value: Number(latestVital.payload?.steps || 0),
            unit: 'steps',
            timestamp: latestVital.generatedAt,
          },
          sleep: {
            deep: Number(latestVital.deepSleepTime || 0),
            light: Number(latestVital.lightSleepTime || 0),
            rem: Number(latestVital.remSleepTime || 0),
          },
        };

        let digitalTwin = await this.digitalTwinRepository.findOne({
          where: { residentId: resident.id },
        });

        if (digitalTwin) {
          digitalTwin.physiology = currentPhysiology;
          digitalTwin.metadata = {
            ...(digitalTwin.metadata || { createdAt: new Date(), twinVersion: 1 }),
            updatedAt: new Date(),
          };
          updatedCount++;
        } else {
          digitalTwin = this.digitalTwinRepository.create({
            residentId: resident.id,
            identity: {
              firstName: resident.firstName || '',
              lastName: resident.lastName || '',
              age: resident.age || 0,
              gender: resident.gender === 1 ? 'Male' : resident.gender === 2 ? 'Female' : 'Other',
            },
            body: {
              heightCm: Number(resident.heightCm || 170),
              weightKg: Number(resident.weight || 70),
            },
            physiology: currentPhysiology,
            baselines: {},
            trends: [],
            correlations: [],
            healthInsights: {
              predictions: [],
              recommendations: [],
            },
            healthRecords: [],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              twinVersion: 1,
            },
          });
          createdCount++;
        }

        await this.digitalTwinRepository.save(digitalTwin);
      }

      this.logger.log(
        `Vitals to Digital Twin sync completed: updated ${updatedCount} twin(s), created ${createdCount} twin(s).`,
      );
    } catch (error) {
      this.logger.error('Failed to sync vitals to digital twin:', error);
    }
  }
}

