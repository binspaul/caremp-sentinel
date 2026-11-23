import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GenomicProfile,
  GeneticRiskTier,
} from './entities/genomic-profile.entity';
import { Resident } from '../residents/entities/resident.entity';
import { ReconcileMedicationDto } from './dtos/reconcile-medication.dto';
import { UpdateGenomicProfileDto } from './dtos/update-genomic-profile.dto';

@Injectable()
export class GenomicsService {
  constructor(
    @InjectRepository(GenomicProfile)
    private readonly genomicProfileRepository: Repository<GenomicProfile>,

    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  async findByResidentId(residentId: number): Promise<GenomicProfile | null> {
    return await this.genomicProfileRepository.findOne({
      where: { residentId, isDeleted: false },
      relations: { resident: true },
    });
  }

  async getCounters(): Promise<{
    totalSequenced: number;
    highRiskCount: number;
    activePgxAlerts: number;
    reconciledCount: number;
  }> {
    const profiles = await this.genomicProfileRepository.find({
      where: { isDeleted: false },
    });

    let highRiskCount = 0;
    let activePgxAlerts = 0;
    let reconciledCount = 0;

    for (const p of profiles) {
      if (p.overallRiskTier === GeneticRiskTier.HIGH) highRiskCount++;
      if (p.activePgxAlerts && Array.isArray(p.activePgxAlerts)) {
        for (const alert of p.activePgxAlerts) {
          if (alert.isReconciled) {
            reconciledCount++;
          } else {
            activePgxAlerts++;
          }
        }
      }
    }

    return {
      totalSequenced: profiles.length,
      highRiskCount,
      activePgxAlerts,
      reconciledCount,
    };
  }

  async reconcileMedication(
    residentId: number,
    dto: ReconcileMedicationDto,
  ): Promise<GenomicProfile> {
    let profile = await this.findByResidentId(residentId);
    if (!profile) {
      throw new NotFoundException(
        `Genomic profile for resident #${residentId} not found.`,
      );
    }

    // Match alert by originalMedication
    let matchedAlert = false;
    const updatedAlerts = (profile.activePgxAlerts || []).map((alert) => {
      if (
        alert.medication.toLowerCase() ===
          dto.originalMedication.toLowerCase() ||
        alert.id.toLowerCase().includes(dto.originalMedication.toLowerCase())
      ) {
        matchedAlert = true;
        return {
          ...alert,
          isReconciled: true,
          reconciledMedication: dto.alternativeMedication,
          reconciledBy: dto.reconciledBy || 'Dr. Sarah Jenkins',
          reconciledAt: new Date().toISOString(),
          clinicalRecommendation: `RECONCILED: Switched to ${dto.alternativeMedication}. ${dto.clinicalNotes || ''}`.trim(),
        };
      }
      return alert;
    });

    // Update active medications list
    const updatedMeds = (profile.activeMedications || []).map((med) => {
      if (med.toLowerCase() === dto.originalMedication.toLowerCase()) {
        return dto.alternativeMedication;
      }
      return med;
    });

    if (!updatedMeds.includes(dto.alternativeMedication)) {
      updatedMeds.push(dto.alternativeMedication);
    }

    profile.activePgxAlerts = updatedAlerts;
    profile.activeMedications = updatedMeds;
    profile.lastAssessedAt = new Date();
    profile.updatedAt = new Date();

    return await this.genomicProfileRepository.save(profile);
  }

  async updateProfile(
    residentId: number,
    dto: UpdateGenomicProfileDto,
  ): Promise<GenomicProfile> {
    let profile = await this.findByResidentId(residentId);
    if (!profile) {
      const resident = await this.residentRepository.findOne({
        where: { id: residentId, isDeleted: false },
      });
      if (!resident) {
        throw new NotFoundException(`Resident #${residentId} not found.`);
      }
      profile = this.genomicProfileRepository.create({
        residentId,
        overallRiskTier: dto.overallRiskTier || GeneticRiskTier.MODERATE,
        prsScores: dto.prsScores || [],
        variants: dto.variants || [],
        activeMedications: dto.activeMedications || [],
        activePgxAlerts: dto.activePgxAlerts || [],
        phenoCalibrations: dto.phenoCalibrations || {},
        sequencingMeta: dto.sequencingMeta || {},
        lastAssessedAt: new Date(),
      });
    } else {
      if (dto.overallRiskTier) profile.overallRiskTier = dto.overallRiskTier;
      if (dto.prsScores) profile.prsScores = dto.prsScores;
      if (dto.variants) profile.variants = dto.variants;
      if (dto.activeMedications) profile.activeMedications = dto.activeMedications;
      if (dto.activePgxAlerts) profile.activePgxAlerts = dto.activePgxAlerts;
      if (dto.phenoCalibrations) profile.phenoCalibrations = dto.phenoCalibrations;
      if (dto.sequencingMeta) profile.sequencingMeta = dto.sequencingMeta;
      profile.lastAssessedAt = new Date();
      profile.updatedAt = new Date();
    }

    return await this.genomicProfileRepository.save(profile);
  }
}
