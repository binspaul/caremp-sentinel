import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vital, Status, Priority, TemperatureUnit, SleepStatus, SleepComputationState } from '../vitals/entities/vital.entity';
import { Resident } from '../residents/entities/resident.entity';
import { FallsService } from '../falls/falls.service';
import { FallSeverity } from '../falls/entities/fall-incident.entity';
import { HealthspanService } from '../healthspan/healthspan.service';

@Injectable()
export class SimulationService {
  constructor(
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,

    @InjectRepository(Vital)
    private readonly vitalRepository: Repository<Vital>,

    private readonly fallsService: FallsService,
    private readonly healthspanService: HealthspanService,
  ) { }

  async simulate(residentId: number, conditionType: number): Promise<Vital> {
    const resident = await this.residentRepository.findOne({
      where: { id: residentId, isDeleted: false },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const lastVital = await this.vitalRepository.findOne({
      where: { residentId },
      order: { generatedAt: 'DESC' },
    });

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

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const getNextVal = (
      prevVal: number | undefined | null,
      ref: number,
      tol: number,
      maxStep: number,
      minDefault: number,
      maxDefault: number,
      pullFactor = 0.08,
      minLimitOverride?: number,
      maxLimitOverride?: number
    ) => {
      const reference = ref !== undefined && ref !== null ? Number(ref) : (minDefault + maxDefault) / 2;
      const tolerance = tol || 5;

      const prevNum = (prevVal !== undefined && prevVal !== null) ? Number(prevVal) : null;
      const hasValidPrev = prevNum !== null && !isNaN(prevNum) && prevNum > 0;

      // Dynamically expand limits if the previous value is outside normal tolerance to allow smooth recovery
      const minLimit = minLimitOverride !== undefined
        ? minLimitOverride
        : (hasValidPrev
          ? Math.min(reference - tolerance, prevNum)
          : reference - tolerance);
      const maxLimit = maxLimitOverride !== undefined
        ? maxLimitOverride
        : (hasValidPrev
          ? Math.max(reference + tolerance, prevNum)
          : reference + tolerance);

      if (!hasValidPrev) {
        return clamp(Math.random() * (maxLimit - minLimit) + minLimit, minLimit, maxLimit);
      }

      const step = (Math.random() * 2 - 1) * maxStep;
      let newVal = Number(prevVal) + step;

      // Revert to target baseline/reference
      newVal = newVal + (reference - newVal) * pullFactor;

      return clamp(newVal, minLimit, maxLimit);
    };

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

    let heartRate: number;
    let hrv: number;
    let systolicBP: number;
    let diastolicBP: number;
    let oxygenSaturation: number;
    let bodyTemperature: number;
    let skinTemperature: number;
    let source = 'simulator';

    switch (conditionType) {
      case 1: // Normal
        {
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

          heartRate = getNextVal(lastVital?.heartRate, targetHr, hrTolerance, 2, 60, 100);

          // --- Physiological Coupling (HRV, Breathing, and BP coupled to HR) ---
          const hrDelta = heartRate - refHeartRate;

          // HRV is inversely coupled to HR
          const coupledHrvRef = refHrv - hrDelta * 0.5;

          hrv = getNextVal(lastVital?.hrv, coupledHrvRef, hrvTolerance, 3, 30, 70);

          // BP coupled to HR shift
          const targetSysBP = refSystolicBP + sysBPCircadianShift + sleepBpShift + hrDelta * 0.2;
          const targetDiaBP = refDiastolicBP + diaBPCircadianShift + (sleepBpShift * 0.6) + hrDelta * 0.1;

          systolicBP = getNextVal(lastVital?.systolicBP, targetSysBP, systolicBPTolerance, 3, 110, 130);
          diastolicBP = getNextVal(lastVital?.diastolicBP, targetDiaBP, diastolicBPTolerance, 2, 70, 85);

          oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, refOxygenSaturation, oxygenSaturationTolerance, 0.5, 95, 100);
          bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature + tempCircadianShift, temperatureToleranceCelsius, 0.05, 36.2, 37.5);
          skinTemperature = bodyTemperature + skinTempOffset;

          source = 'simulator';
        }

        break;

      case 2: // Cardiac Issue
        heartRate = getNextVal(lastVital?.heartRate, 155, 10, 5, 145, 165, 0.7, 145, 165);
        hrv = getNextVal(lastVital?.hrv, 10, 2, 1, 8, 12, 0.7, 8, 12);
        systolicBP = getNextVal(lastVital?.systolicBP, 182.5, 7.5, 4, 175, 190, 0.7, 175, 190);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 110, 5, 3, 105, 115, 0.7, 105, 115);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 86, 2, 1, 84, 88, 0.7, 84, 88);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature, temperatureToleranceCelsius, 0.05, 36.2, 37.5, 0.08);
        skinTemperature = bodyTemperature - 1.5;
        source = 'cardiac-simulator';

        break;

      case 3: // Stroke Issue
        heartRate = getNextVal(lastVital?.heartRate, 97.5, 12.5, 4, 85, 110, 0.7, 85, 110);
        hrv = getNextVal(lastVital?.hrv, 20, 5, 2, 15, 25, 0.7, 15, 25);
        systolicBP = getNextVal(lastVital?.systolicBP, 195, 10, 5, 185, 205, 0.7, 185, 205);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 117.5, 7.5, 3, 110, 125, 0.7, 110, 125);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 92.5, 2.5, 1, 90, 95, 0.7, 90, 95);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature, temperatureToleranceCelsius, 0.05, 36.2, 37.5, 0.08);
        skinTemperature = bodyTemperature - 1.5;
        source = 'stroke-simulator';

        break;

      case 4: // Hypoxia / Respiratory Distress
        heartRate = getNextVal(lastVital?.heartRate, 110, 10, 3, 100, 120, 0.7, 100, 120);
        hrv = getNextVal(lastVital?.hrv, 25, 5, 2, 20, 30, 0.7, 20, 30);
        systolicBP = getNextVal(lastVital?.systolicBP, refSystolicBP, systolicBPTolerance, 3, 115, 130, 0.08);
        diastolicBP = getNextVal(lastVital?.diastolicBP, refDiastolicBP, diastolicBPTolerance, 2, 70, 85, 0.08);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 83.5, 3.5, 1.5, 80, 87, 0.7, 80, 87);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature, temperatureToleranceCelsius, 0.05, 36.2, 37.5, 0.08);
        skinTemperature = bodyTemperature - 1.5;
        source = 'hypoxia-simulator';

        break;

      case 5: // Fever / Infection
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, 39.5, 0.7, 0.2, 38.8, 40.2, 0.7, 38.8, 40.2);
        skinTemperature = bodyTemperature - 1.2;
        heartRate = getNextVal(lastVital?.heartRate, 105, 10, 3, 95, 115, 0.7, 95, 115);
        hrv = getNextVal(lastVital?.hrv, 30, 5, 2, 25, 35, 0.7, 25, 35);
        systolicBP = getNextVal(lastVital?.systolicBP, refSystolicBP, systolicBPTolerance, 3, 110, 130, 0.08);
        diastolicBP = getNextVal(lastVital?.diastolicBP, refDiastolicBP, diastolicBPTolerance, 2, 70, 85, 0.08);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, refOxygenSaturation, oxygenSaturationTolerance, 0.5, 95, 100, 0.08);
        source = 'fever-simulator';

        break;

      case 6: // Sepsis Prodrome & Acute Deterioration (NEWS2 High)
        heartRate = getNextVal(lastVital?.heartRate, 126, 8, 4, 118, 138, 0.75, 118, 138);
        hrv = getNextVal(lastVital?.hrv, 14, 3, 1, 10, 18, 0.75, 10, 18);
        systolicBP = getNextVal(lastVital?.systolicBP, 88, 5, 3, 80, 94, 0.75, 80, 94);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 54, 4, 2, 48, 60, 0.75, 48, 60);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 89, 2, 1, 86, 91, 0.75, 86, 91);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, 39.3, 0.5, 0.2, 38.9, 39.8, 0.75, 38.9, 39.8);
        skinTemperature = bodyTemperature - 1.0;
        source = 'sepsis-simulator';

        break;

      case 7: // Nocturnal Arrhythmia & Sleep Apnea/Hypoxia Event
        heartRate = getNextVal(lastVital?.heartRate, 128, 10, 5, 115, 140, 0.75, 115, 140);
        hrv = getNextVal(lastVital?.hrv, 12, 3, 1, 8, 16, 0.75, 8, 16);
        systolicBP = getNextVal(lastVital?.systolicBP, 148, 7, 3, 140, 158, 0.75, 140, 158);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 92, 5, 2, 86, 98, 0.75, 86, 98);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 85, 3, 1.5, 82, 88, 0.75, 82, 88);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature, temperatureToleranceCelsius, 0.05, 36.2, 37.5, 0.08);
        skinTemperature = bodyTemperature - 1.4;
        source = 'nocturnal-arrhythmia-simulator';

        break;

      case 8: // Pharmacogenomics (PGx) Adverse Conflict Event
        heartRate = getNextVal(lastVital?.heartRate, 104, 6, 3, 96, 112, 0.7, 96, 112);
        hrv = getNextVal(lastVital?.hrv, 18, 4, 1.5, 14, 24, 0.7, 14, 24);
        systolicBP = getNextVal(lastVital?.systolicBP, 152, 8, 4, 142, 162, 0.7, 142, 162);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 94, 5, 2, 88, 100, 0.7, 88, 100);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 95, 1.5, 0.5, 93, 97, 0.08);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, 37.4, 0.3, 0.1, 37.0, 37.8, 0.08);
        skinTemperature = bodyTemperature - 1.2;
        source = 'pgx-adverse-simulator';

        break;

      case 9: // Acute Fall & Post-Impact Immobility
        heartRate = getNextVal(lastVital?.heartRate, 118, 8, 4, 110, 126, 0.75, 110, 126);
        hrv = getNextVal(lastVital?.hrv, 15, 3, 1, 10, 20, 0.75, 10, 20);
        systolicBP = getNextVal(lastVital?.systolicBP, 92, 5, 3, 85, 98, 0.75, 85, 98);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 58, 4, 2, 52, 64, 0.75, 52, 64);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 96, 1.5, 0.5, 94, 98, 0.08);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, refBodyTemperature, temperatureToleranceCelsius, 0.05, 36.2, 37.5, 0.08);
        skinTemperature = bodyTemperature - 1.4;
        source = 'fall-immobility-simulator';

        // Auto-create an acute FallIncident
        await this.fallsService.create({
          residentId,
          impactForceG: 3.4,
          orientationChangeDeg: 88.0,
          motionlessDurationSeconds: 45,
          severity: FallSeverity.CRITICAL,
          location: resident.address ? `${resident.address} - Bedside` : 'Bedroom Bedside',
          clinicalDescription: 'Sudden high-g deceleration impact (3.4g) followed by 45s loss of thoracic micro-motion.',
        });

        break;

      case 10: // Multimodal Longevity Protocol Reversal (Healthspan Optimization)
        heartRate = getNextVal(lastVital?.heartRate, 64, 4, 2, 60, 70, 0.7, 60, 70);
        hrv = getNextVal(lastVital?.hrv, 58, 6, 2, 52, 68, 0.7, 52, 68);
        systolicBP = getNextVal(lastVital?.systolicBP, 116, 4, 2, 110, 122, 0.7, 110, 122);
        diastolicBP = getNextVal(lastVital?.diastolicBP, 74, 3, 1.5, 70, 78, 0.7, 70, 78);
        oxygenSaturation = getNextVal(lastVital?.oxygenSaturation, 99, 0.5, 0.2, 98, 100, 0.08);
        bodyTemperature = getNextVal(lastVital?.bodyTemperature, 36.6, 0.2, 0.05, 36.4, 37.0, 0.08);
        skinTemperature = bodyTemperature - 1.2;
        source = 'longevity-reversal-simulator';

        // Auto-save rejuvenated HealthspanAssessment record
        await this.healthspanService.simulateIntervention(residentId, {
          protocol: 'SGLT2i + Progressive Resistance Training + Circadian Sleep Entrainment',
          monthsOfIntervention: 6,
          biologicalAgeReductionYears: 2.8,
          notes: 'Clinically guided longevity reversal protocol completed.',
        });

        break;

      default:
        throw new NotFoundException('Invalid condition type');
    }

    // --- Battery Level Drain & Voltage Simulation ---
    const lastBattery = lastVital?.batteryLevel !== undefined && lastVital?.batteryLevel !== null ? Number(lastVital.batteryLevel) : (80 + Math.random() * 20);

    let batteryLevel = lastBattery - (0.05 + Math.random() * 0.05); // Slow decay

    if (batteryLevel < 15) {
      batteryLevel = 100; // Simulated recharge/device swap
    }

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
      residentId,
      generatedAt: now,
      heartRate: parseFloat(finalHeartRate.toFixed(2)),
      hrv: parseFloat(finalHrv.toFixed(2)),
      systolicBP: parseFloat(finalSystolicBP.toFixed(2)),
      diastolicBP: parseFloat(finalDiastolicBP.toFixed(2)),
      oxygenSaturation: parseFloat(finalOxygenSaturation.toFixed(2)),
      wearingIndicator: true,
      movementDetected: conditionType === 9 ? false : true,
      bodyTemperature: parseFloat(finalBodyTemperature.toFixed(2)),
      skinTemperature: parseFloat(finalSkinTemperature.toFixed(2)),
      temperatureUnit: TemperatureUnit.CELSIUS,
      batteryLevel: parseFloat(batteryLevel.toFixed(2)),
      payload: {
        source,
        ...(conditionType === 9 ? { fallImpactG: 3.4, motionlessSec: 45 } : {}),
      },
      deepSleepTime,
      lightSleepTime,
      remSleepTime,
      awakeSleepTime,
      totalSleepTime,
      sleepStatus,
      sleepComputationState,
    });

    return this.vitalRepository.save(vital);
  }
}
