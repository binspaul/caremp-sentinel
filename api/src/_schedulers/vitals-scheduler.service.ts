import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Resident } from 'src/residents/entities/resident.entity';
import { SleepComputationState, SleepStatus, TemperatureUnit, Vital } from 'src/vitals/entities/vital.entity';

@Injectable()
export class VitalsSchedulerService {
  private readonly logger = new Logger(VitalsSchedulerService.name);

  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,

    @InjectRepository(Vital)
    private readonly vitalRepository: Repository<Vital>,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Executing vitals generation scheduler...');

    try {
      const residents = await this.residentRepository.find({
        where: { isActive: true, isDeleted: false },
      });

      if (!residents || residents.length === 0) {
        this.logger.warn('# No active residents found. Skipping vital generation.');

        return;
      }

      const getVal = (ref: number, tol: number, minDefault: number, maxDefault: number) => {
        if (ref !== undefined && ref !== null) {
          const t = tol || 5;
          const min = Number(ref) - Number(t);
          const max = Number(ref) + Number(t);

          return Math.random() * (max - min) + min;
        }

        return Math.random() * (maxDefault - minDefault) + minDefault;
      };

      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

      const vitalsToSave = [];

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      let isSleepWindow = false;
      let elapsedMinutes = 0;
      let sleepComputationState = SleepComputationState.UNKNOWN;
      let sleepStatus = SleepStatus.UNKNOWN;

      if (hours >= 22) {
        isSleepWindow = true;
        elapsedMinutes = (hours - 22) * 60 + minutes;
        sleepComputationState = SleepComputationState.PARTIAL;
      } else if (hours < 7) {
        isSleepWindow = true;
        elapsedMinutes = (hours + 2) * 60 + minutes;
        sleepComputationState = SleepComputationState.PARTIAL;
      } else if (hours === 7 && minutes === 0) {
        isSleepWindow = true;
        elapsedMinutes = 540;
        sleepComputationState = SleepComputationState.FINAL;
      }

      let deepSleepTime = 0;
      let lightSleepTime = 0;
      let remSleepTime = 0;
      let awakeSleepTime = 0;
      let totalSleepTime = 0;

      if (isSleepWindow) {
        deepSleepTime = Math.floor(elapsedMinutes * 0.25);
        lightSleepTime = Math.floor(elapsedMinutes * 0.50);
        remSleepTime = Math.floor(elapsedMinutes * 0.25);
        awakeSleepTime = Math.floor(elapsedMinutes * 0.10);
        totalSleepTime = deepSleepTime + lightSleepTime + remSleepTime;

        const remainder = elapsedMinutes % 90;

        if (remainder < 10) {
          sleepStatus = SleepStatus.AWAKE;
        } else if (remainder < 45) {
          sleepStatus = SleepStatus.LIGHT_SLEEP;
        } else {
          sleepStatus = SleepStatus.DEEP_SLEEP;
        }
      }

      for (const resident of residents) {
        const lastVital = await this.vitalRepository.findOne({
          where: { residentId: resident.id },
          order: { generatedAt: 'DESC' },
        });

        const getNextVal = (
          prevVal: number | undefined | null,
          ref: number,
          tol: number,
          maxStep: number,
          minDefault: number,
          maxDefault: number
        ) => {
          const reference = ref !== undefined && ref !== null ? Number(ref) : (minDefault + maxDefault) / 2;
          const tolerance = tol || 5;

          const prevNum = (prevVal !== undefined && prevVal !== null) ? Number(prevVal) : null;
          const hasValidPrev = prevNum !== null && !isNaN(prevNum) && prevNum > 0;

          // Dynamically expand limits if the previous value is outside normal tolerance to allow smooth recovery
          const minLimit = hasValidPrev
            ? Math.min(reference - tolerance, prevNum)
            : reference - tolerance;
          const maxLimit = hasValidPrev
            ? Math.max(reference + tolerance, prevNum)
            : reference + tolerance;

          if (!hasValidPrev) {
            return clamp(Math.random() * (maxLimit - minLimit) + minLimit, minLimit, maxLimit);
          }

          const step = (Math.random() * 2 - 1) * maxStep;

          let newVal = Number(prevVal) + step;

          // Revert to baseline (pull factor of 0.08)
          const pullFactor = 0.08;

          newVal = newVal + (reference - newVal) * pullFactor;

          return clamp(newVal, minLimit, maxLimit);
        };

        const refHeartRate = Number(resident.referenceHeartRate) > 0 ? Number(resident.referenceHeartRate) : 75;
        const refHrv = Number(resident.referenceHrv) > 0 ? Number(resident.referenceHrv) : 40;
        const refSystolicBP = Number(resident.referenceSystolicBP) > 0 ? Number(resident.referenceSystolicBP) : 120;
        const refDiastolicBP = Number(resident.referenceDiastolicBP) > 0 ? Number(resident.referenceDiastolicBP) : 80;
        const refOxygenSaturation = Number(resident.referenceOxygenSaturation) > 0 ? Number(resident.referenceOxygenSaturation) : 98;
        const refBodyTemperature = Number(resident.referenceBodyTemperature) > 0 ? Number(resident.referenceBodyTemperature) : 36.8;
        const hrTolerance = Number(resident.heartRateTolerance) > 0 ? Number(resident.heartRateTolerance) : 20;
        const hrvTolerance = Number(resident.hrvTolerance) > 0 ? Number(resident.hrvTolerance) : 15;
        const systolicBPTolerance = Number(resident.systolicBPTolerance) > 0 ? Number(resident.systolicBPTolerance) : 20;
        const diastolicBPTolerance = Number(resident.diastolicBPTolerance) > 0 ? Number(resident.diastolicBPTolerance) : 15;
        const oxygenSaturationTolerance = Number(resident.oxygenSaturationTolerance) > 0 ? Number(resident.oxygenSaturationTolerance) : 5;
        const temperatureToleranceCelsius = Number(resident.temperatureToleranceCelsius) > 0 ? Number(resident.temperatureToleranceCelsius) : 1.5;

        const hrCircadianShift = 6 * Math.sin((2 * Math.PI * (hours - 9)) / 24);
        const sysBPCircadianShift = 5 * Math.sin((2 * Math.PI * (hours - 9)) / 24);
        const diaBPCircadianShift = 3 * Math.sin((2 * Math.PI * (hours - 9)) / 24);
        const tempCircadianShift = 0.35 * Math.sin((2 * Math.PI * (hours - 9)) / 24);

        // --- Sleep Adjustments (Nocturnal Dipping & Peripheral Temp) ---
        let sleepHrShift = 0;
        let sleepBpShift = 0;
        let skinTempOffset = -1.5;
        if (isSleepWindow) {
          if (sleepStatus === SleepStatus.DEEP_SLEEP) {
            sleepHrShift = -12;
            sleepBpShift = -12;
            skinTempOffset = -0.9; // Peripheral skin temperature increases relative to core during deep sleep (vasodilation)
          } else if (sleepStatus === SleepStatus.LIGHT_SLEEP) {
            sleepHrShift = -8;
            sleepBpShift = -8;
            skinTempOffset = -1.1;
          }
        }

        const targetHr = refHeartRate + hrCircadianShift + sleepHrShift;
        const heartRate = getNextVal(lastVital?.heartRate, targetHr, hrTolerance, 2, 60, 100);

        // --- Physiological Coupling (HRV, Breathing, and BP coupled to HR) ---
        const hrDelta = heartRate - refHeartRate;

        // HRV is inversely coupled to HR
        const coupledHrvRef = refHrv - hrDelta * 0.5;
        const hrv = getNextVal(lastVital?.hrv, coupledHrvRef, hrvTolerance, 3, 30, 70);

        // BP coupled to HR shift
        const targetSysBP = refSystolicBP + sysBPCircadianShift + sleepBpShift + hrDelta * 0.2;
        const targetDiaBP = refDiastolicBP + diaBPCircadianShift + (sleepBpShift * 0.6) + hrDelta * 0.1;
        const systolicBP = getNextVal(lastVital?.systolicBP, targetSysBP, systolicBPTolerance, 3, 110, 130);
        const diastolicBP = getNextVal(lastVital?.diastolicBP, targetDiaBP, diastolicBPTolerance, 2, 70, 85);

        const rawOxygenSaturation = getNextVal(lastVital?.oxygenSaturation, refOxygenSaturation, oxygenSaturationTolerance, 0.5, 95, 100);
        const oxygenSaturation = rawOxygenSaturation > 100 ? 100 : rawOxygenSaturation;
        const bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature + tempCircadianShift, temperatureToleranceCelsius, 0.05, 36.2, 37.5);
        const skinTemperature = bodyTemperature + skinTempOffset;

        // --- Battery Level Drain & Voltage Simulation ---
        const lastBattery = lastVital?.batteryLevel !== undefined && lastVital?.batteryLevel !== null ? Number(lastVital.batteryLevel) : (80 + Math.random() * 20);
        let batteryLevel = lastBattery - (0.05 + Math.random() * 0.05); // Slow decay
        if (batteryLevel < 15) {
          batteryLevel = 100; // Simulated recharge/device swap
        }
        const batteryVoltage = 3.6 + (batteryLevel / 100) * 0.6 + (Math.random() * 0.04 - 0.02);

        // --- Physiological Safety Clamping ---
        const clampVal = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
        const finalHeartRate = clampVal(heartRate, 30, 220);
        const finalHrv = clampVal(hrv, 5, 200);
        const finalSystolicBP = clampVal(systolicBP, 60, 250);
        const finalDiastolicBP = clampVal(diastolicBP, 30, 150);
        const finalOxygenSaturation = clampVal(oxygenSaturation, 50, 100);
        const finalBodyTemperature = clampVal(bodyTemperature, 33.0, 43.0);
        const finalSkinTemperature = clampVal(skinTemperature, 30.0, 42.0);

        const vital = this.vitalRepository.create({
          residentId: resident.id,
          generatedAt: now,
          heartRate: parseFloat(finalHeartRate.toFixed(2)),
          hrv: parseFloat(finalHrv.toFixed(2)),
          systolicBP: parseFloat(finalSystolicBP.toFixed(2)),
          diastolicBP: parseFloat(finalDiastolicBP.toFixed(2)),
          oxygenSaturation: parseFloat(finalOxygenSaturation.toFixed(2)),
          wearingIndicator: true,
          movementDetected: true,
          bodyTemperature: parseFloat(finalBodyTemperature.toFixed(2)),
          skinTemperature: parseFloat(finalSkinTemperature.toFixed(2)),
          temperatureUnit: TemperatureUnit.CELSIUS,
          batteryLevel: parseFloat(batteryLevel.toFixed(2)),
          payload: { source: 'simulator' },
          deepSleepTime,
          lightSleepTime,
          remSleepTime,
          awakeSleepTime,
          totalSleepTime,
          sleepStatus,
          sleepComputationState
        });

        vitalsToSave.push(vital);
      }

      await this.vitalRepository.save(vitalsToSave);
      this.logger.log(`Successfully generated vitals for ${vitalsToSave.length} residents.`);
    } catch (error) {
      this.logger.error('Failed to generate vitals for residents:', error);
    }
  }
}
