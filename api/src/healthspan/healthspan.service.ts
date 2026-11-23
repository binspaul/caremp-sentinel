import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HealthspanAssessment,
  FrailtyClassification,
} from './entities/healthspan-assessment.entity';
import { Resident } from '../residents/entities/resident.entity';
import { SimulateInterventionDto } from './dtos/simulate-intervention.dto';

@Injectable()
export class HealthspanService {
  constructor(
    @InjectRepository(HealthspanAssessment)
    private readonly healthspanRepository: Repository<HealthspanAssessment>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  async findLatestByResidentId(
    residentId: number,
  ): Promise<HealthspanAssessment | null> {
    return await this.healthspanRepository.findOne({
      where: { residentId, isDeleted: false },
      order: { generatedAt: 'DESC' },
      relations: { resident: true },
    });
  }

  async findHistoryByResidentId(
    residentId: number,
    limit = 50,
    skip = 0,
  ): Promise<[HealthspanAssessment[], number]> {
    return await this.healthspanRepository.findAndCount({
      where: { residentId, isDeleted: false },
      order: { generatedAt: 'DESC' },
      take: limit,
      skip,
      relations: { resident: true },
    });
  }

  async getCohortSummary(): Promise<{
    averageBioAgeDelta: number;
    robustPct: number;
    preFrailPct: number;
    frailPct: number;
    totalResidentsAssessed: number;
  }> {
    // Group by residentId to find latest per resident
    const residents = await this.residentRepository.find({
      where: { isDeleted: false },
    });

    if (residents.length === 0) {
      return {
        averageBioAgeDelta: 0,
        robustPct: 100,
        preFrailPct: 0,
        frailPct: 0,
        totalResidentsAssessed: 0,
      };
    }

    let totalDelta = 0;
    let robustCount = 0;
    let preFrailCount = 0;
    let frailCount = 0;
    let assessedCount = 0;

    for (const resident of residents) {
      const latest = await this.findLatestByResidentId(resident.id);
      if (latest) {
        assessedCount++;
        totalDelta += Number(latest.biologicalAgeDelta);
        if (latest.classification === FrailtyClassification.ROBUST) robustCount++;
        else if (latest.classification === FrailtyClassification.PRE_FRAIL)
          preFrailCount++;
        else if (latest.classification === FrailtyClassification.FRAIL)
          frailCount++;
      }
    }

    const count = assessedCount || 1;
    return {
      averageBioAgeDelta: parseFloat((totalDelta / count).toFixed(1)),
      robustPct: Math.round((robustCount / count) * 100),
      preFrailPct: Math.round((preFrailCount / count) * 100),
      frailPct: Math.round((frailCount / count) * 100),
      totalResidentsAssessed: assessedCount,
    };
  }

  async create(
    data: Partial<HealthspanAssessment>,
  ): Promise<HealthspanAssessment> {
    const record = this.healthspanRepository.create({
      ...data,
      generatedAt: data.generatedAt || new Date(),
    });
    return await this.healthspanRepository.save(record);
  }

  async simulateIntervention(
    residentId: number,
    dto: SimulateInterventionDto,
  ): Promise<HealthspanAssessment> {
    const resident = await this.residentRepository.findOne({
      where: { id: residentId, isDeleted: false },
    });
    if (!resident) {
      throw new NotFoundException(`Resident #${residentId} not found.`);
    }

    const latest = await this.findLatestByResidentId(residentId);
    const chronoAge = resident.age || 72;

    const currentDelta = latest ? Number(latest.biologicalAgeDelta) : 2.5;
    const reductionYears = dto.biologicalAgeReductionYears ?? 2.8;
    const newDelta = parseFloat((currentDelta - reductionYears).toFixed(1));
    const newBioAge = parseFloat((chronoAge + newDelta).toFixed(1));

    // Improved e-FI frailty score
    const currentEFI = latest ? Number(latest.frailtyIndex) : 0.28;
    const newEFI = Math.max(0.06, parseFloat((currentEFI - 0.12).toFixed(3)));

    let classification = FrailtyClassification.ROBUST;
    if (newEFI > 0.24) classification = FrailtyClassification.FRAIL;
    else if (newEFI >= 0.12) classification = FrailtyClassification.PRE_FRAIL;

    const interventions = latest?.longevityInterventions
      ? [...latest.longevityInterventions]
      : [];
    if (!interventions.includes(dto.protocol)) {
      interventions.unshift(dto.protocol);
    }

    const simulatedRecord = this.healthspanRepository.create({
      residentId,
      generatedAt: new Date(),
      chronologicalAge: chronoAge,
      biologicalAge: newBioAge,
      biologicalAgeDelta: newDelta,
      frailtyIndex: newEFI,
      classification,
      sarcopeniaRisk: 'LOW',
      mobilityCadenceScore: 88.5,
      autonomicResilience: 86.0,
      contributingDeficits: [
        'Enhanced vagal parasympathetic recovery tone',
        'Normal circadian nocturnal blood pressure dipping restored',
      ],
      longevityInterventions: interventions,
      protocolPhase: 'active_intervention',
      source: 'longevity-simulation',
    });

    return await this.healthspanRepository.save(simulatedRecord);
  }
}
