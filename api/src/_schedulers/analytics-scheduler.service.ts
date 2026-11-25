import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { Resident } from 'src/residents/entities/resident.entity';
import { RoomZone } from 'src/facility/entities/room-zone.entity';
import { Vital, TemperatureUnit } from 'src/vitals/entities/vital.entity';
import { DigitalTwinService } from 'src/digital-twin/digital-twin.service';
import { CreateDigitalTwinDto } from 'src/digital-twin/dtos/create-digital-twin.dto';

@Injectable()
export class AnalyticsSchedulerService {
  private readonly logger = new Logger(AnalyticsSchedulerService.name);

  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,

    @InjectRepository(RoomZone)
    private readonly roomZoneRepository: Repository<RoomZone>,

    @InjectRepository(Vital)
    private readonly vitalRepository: Repository<Vital>,

    private readonly digitalTwinService: DigitalTwinService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Executing Analytics Engine Scheduler for Dementia Pipeline...');

    const baseUrl = this.configService.get<string>('ANALYTICS_ENGINE_URL') || 'http://localhost:5001';

    try {
      const residents = await this.residentRepository.find({
        where: { isActive: true, isDeleted: false },
      });

      if (!residents || residents.length === 0) {
        this.logger.warn('No active residents found. Skipping analytics run.');
        return;
      }

      for (const resident of residents) {
        try {
          await this.runAnalyticsForResident(resident.id, baseUrl);
        } catch (error) {
          this.logger.error(`Failed to run analytics for resident ${resident.id}:`, error);
        }
      }

      this.logger.log(`Analytics run complete for ${residents.length} resident(s) across active dementia engines.`);
    } catch (error) {
      this.logger.error('Failed to run analytics scheduler:', error);
    }
  }

  /**
   * On-demand manual trigger method for a single resident.
   * Runs the active dementia engines and persists the updated digital twin.
   */
  async runAnalyticsForResidentNow(residentId: number): Promise<any> {
    const baseUrl = this.configService.get<string>('ANALYTICS_ENGINE_URL') || 'http://localhost:5001';
    return this.runAnalyticsForResident(residentId, baseUrl);
  }

  private async runAnalyticsForResident(residentId: number, baseUrl: string): Promise<any> {
    const twin = await this.digitalTwinService.findByResidentId(residentId);

    if (!twin) {
      this.logger.debug(`No digital twin yet for resident ${residentId}. Skipping.`);
      return null;
    }

    // Attach latest live vital reading with fresh timestamp
    const latestVital = await this.vitalRepository.findOne({
      where: { residentId, isDeleted: false },
      order: { generatedAt: 'DESC' },
    });

    if (latestVital) {
      twin.physiology = {
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
    }

    // Attach real facility location/zone if available
    const zone = await this.roomZoneRepository.findOne({
      where: { currentResidentId: residentId },
    });
    const locationData = zone
      ? {
          currentZone: zone.name,
          zoneType: zone.zoneType,
          isSafePerimeter: zone.isSafePerimeter,
        }
      : {
          currentZone: 'Suite 201',
          zoneType: 'suite',
          isSafePerimeter: true,
        };

    let updatedTwin: Record<string, any> = { ...twin, location: locationData };

    // Execute active dementia pipeline:
    // (Baseline -> Trend -> Correlation -> Deterioration -> Sundowning -> Wandering -> Circadian -> AI Summary)
    updatedTwin = (await this.httpService.axiosRef.post(`${baseUrl}/engines/pipeline`, updatedTwin)).data;

    // Single save with everything merged to PostgreSQL
    const saved = await this.digitalTwinService.create(updatedTwin as CreateDigitalTwinDto);
    return saved;
  }
}
