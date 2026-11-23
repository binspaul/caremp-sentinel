import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { Resident } from 'src/residents/entities/resident.entity';
import { DigitalTwinService } from 'src/digital-twin/digital-twin.service';
import { CreateDigitalTwinDto } from 'src/digital-twin/dtos/create-digital-twin.dto';

@Injectable()
export class AnalyticsSchedulerService {
  private readonly logger = new Logger(AnalyticsSchedulerService.name);

  // How many ticks (1 tick = 1 minute, matching @Cron below) pass between
  // recomputing Healthy Ageing's score and the AI Summary. Baseline/Trend/
  // Correlation deliberately run every tick regardless of this - they need
  // every reading to keep their rolling windows accurate; throttling *them*
  // would starve the window (a 30-reading window would take 150 real minutes
  // to fill instead of 30, since only 1 in 5 readings would ever be seen).
  // Healthy Ageing/AI Summary don't have that problem - they only ever read
  // Baseline/Trend/Correlation's current state, so it's safe (and for AI
  // Summary, cost-saving) to compute them less often.
  private static readonly SLOW_ENGINE_INTERVAL_TICKS = 5;
  private tickCount = 0;

  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,

    private readonly digitalTwinService: DigitalTwinService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Executing Analytics Engine Scheduler...');

    const baseUrl = this.configService.get<string>('ANALYTICS_ENGINE_URL') || 'http://localhost:5001';

    this.tickCount += 1;
    // Fires on tick 1 (so residents get an initial score/summary right away
    // instead of waiting 5 minutes after startup) and then every
    // SLOW_ENGINE_INTERVAL_TICKS ticks after that.
    const shouldRunSlowEngines =
      (this.tickCount - 1) % AnalyticsSchedulerService.SLOW_ENGINE_INTERVAL_TICKS === 0;

    try {
      const residents = await this.residentRepository.find({
        where: { isActive: true, isDeleted: false },
      });

      if (!residents || residents.length === 0) {
        this.logger.warn('No active residents found. Skipping analytics run.');
        return;
      }

      // Sequential, per resident: fetch the twin once, chain it through the
      // engine calls for this tick (each response feeds the next call), then
      // save once. Deliberately NOT independent read-modify-write cycles per
      // resident - that would risk one engine's save silently clobbering
      // another's if their requests ever interleaved.
      for (const resident of residents) {
        try {
          await this.runAnalyticsForResident(resident.id, baseUrl, shouldRunSlowEngines);
        } catch (error) {
          this.logger.error(`Failed to run analytics for resident ${resident.id}:`, error);
          // Continue with the next resident - one failure shouldn't block the rest.
        }
      }

      this.logger.log(
        `Analytics run complete for ${residents.length} resident(s)` +
        (shouldRunSlowEngines ? ' (including Healthy Ageing + AI Summary this tick).' : '.'),
      );
    } catch (error) {
      this.logger.error('Failed to run analytics scheduler:', error);
    }
  }

  /**
   * On-demand manual trigger method for a single resident.
   * Runs all engines (including Healthy Ageing and AI Summary) and persists the updated digital twin.
   */
  async runAnalyticsForResidentNow(residentId: number): Promise<any> {
    const baseUrl = this.configService.get<string>('ANALYTICS_ENGINE_URL') || 'http://localhost:5001';
    return this.runAnalyticsForResident(residentId, baseUrl, true);
  }

  private async runAnalyticsForResident(residentId: number, baseUrl: string, shouldRunSlowEngines: boolean): Promise<any> {
    const twin = await this.digitalTwinService.findByResidentId(residentId);

    if (!twin) {
      this.logger.debug(`No digital twin yet for resident ${residentId}. Skipping.`);
      return null;
    }

    let updatedTwin: Record<string, any> = twin;

    // Baseline/Trend/Correlation: every tick, always
    updatedTwin = (await this.httpService.axiosRef.post(`${baseUrl}/engines/baseline`, updatedTwin)).data;
    updatedTwin = (await this.httpService.axiosRef.post(`${baseUrl}/engines/trend`, updatedTwin)).data;
    updatedTwin = (await this.httpService.axiosRef.post(`${baseUrl}/engines/correlation`, updatedTwin)).data;

    // Healthy Ageing + AI Summary: slow engines
    if (shouldRunSlowEngines) {
      updatedTwin = (await this.httpService.axiosRef.post(`${baseUrl}/engines/healthy-ageing`, updatedTwin)).data;
      updatedTwin = (await this.httpService.axiosRef.post(`${baseUrl}/engines/ai-summary`, updatedTwin)).data;
    }

    // Single save with everything merged
    const saved = await this.digitalTwinService.create(updatedTwin as CreateDigitalTwinDto);
    return saved;
  }
}
