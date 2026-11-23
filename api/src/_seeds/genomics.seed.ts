import { DataSource } from 'typeorm';
import {
  GenomicProfile,
  GeneticRiskTier,
} from '../genomics/entities/genomic-profile.entity';
import { Resident } from '../residents/entities/resident.entity';

export async function seedGenomics(dataSource: DataSource): Promise<GenomicProfile[]> {
  const profileRepo = dataSource.getRepository(GenomicProfile);
  const residentRepo = dataSource.getRepository(Resident);

  const existingCount = await profileRepo.count();
  if (existingCount > 0) {
    console.info(`Found ${existingCount} genomic profiles, skipping genomics seeding.`);
    return await profileRepo.find();
  }

  const residents = await residentRepo.find({ where: { isDeleted: false } });
  if (residents.length === 0) {
    console.warn('No residents found for genomics seeding.');
    return [];
  }

  const seededProfiles: GenomicProfile[] = [];

  for (const resident of residents) {
    if (resident.uhid === 'RES-001') {
      // Alex Rivera (72yo male, CAD & PGx conflict)
      const p = profileRepo.create({
        residentId: resident.id,
        overallRiskTier: GeneticRiskTier.HIGH,
        prsScores: [
          {
            condition: 'Coronary Artery Disease (CAD)',
            percentile: 84.0,
            riskLevel: 'HIGH',
            oddsRatio: 1.85,
            snpsEvaluated: 182,
            clinicalTarget: 'Systolic BP target tightened to <125 mmHg; mandatory nocturnal dipping >10%.',
            phenoCalibrations: { systolicBPMax: 125, diastolicBPMax: 80, nocturnalDipMinPct: 10 },
          },
          {
            condition: 'Type 2 Diabetes (T2D)',
            percentile: 62.0,
            riskLevel: 'ELEVATED',
            oddsRatio: 1.24,
            snpsEvaluated: 240,
            clinicalTarget: 'Continuous glycemic strain monitoring & tighter resting HRV tolerance.',
            phenoCalibrations: { hrvFloorMin: 30 },
          },
          {
            condition: "Late-Onset Alzheimer's Disease",
            percentile: 72.0,
            riskLevel: 'ELEVATED',
            oddsRatio: 1.45,
            snpsEvaluated: 64,
            clinicalTarget: 'Deep sleep preservation protocol; slow-wave sleep duration >90 min.',
          },
          {
            condition: 'Age-Related Sarcopenia',
            percentile: 58.0,
            riskLevel: 'MODERATE',
            oddsRatio: 1.15,
            snpsEvaluated: 95,
            clinicalTarget: 'Locomotion step cadence tracking; target >90 steps/min.',
          },
        ],
        variants: [
          { gene: 'CYP2C19', diplotype: '*1/*2', phenotype: 'INTERMEDIATE' },
          { gene: 'SLCO1B1', diplotype: '521T>C', phenotype: 'DECREASED' },
          { gene: 'CYP2D6', diplotype: '*1/*1', phenotype: 'NORMAL' },
          { gene: 'CYP2C9', diplotype: '*1/*1', phenotype: 'NORMAL' },
        ],
        activeMedications: ['Clopidogrel', 'Atorvastatin', 'Lisinopril'],
        activePgxAlerts: [
          {
            id: 'ALERT-CYP2C19-CLOPIDOGREL',
            medication: 'Clopidogrel',
            gene: 'CYP2C19',
            diplotype: '*1/*2',
            phenotype: 'INTERMEDIATE',
            severity: 'HIGH_RISK',
            cpicLevel: 'A',
            mechanism: 'Reduced CYP2C19 bioactivation leading to subtherapeutic active metabolite concentration.',
            clinicalRecommendation: 'Avoid clopidogrel due to significantly increased stent thrombosis and ischemic recurrence.',
            alternativeOptions: ['Ticagrelor 90mg BID', 'Prasugrel 10mg daily'],
            isReconciled: false,
          },
          {
            id: 'ALERT-SLCO1B1-ATORVASTATIN',
            medication: 'Atorvastatin',
            gene: 'SLCO1B1',
            diplotype: '521T>C',
            phenotype: 'DECREASED',
            severity: 'WARNING',
            cpicLevel: 'A',
            mechanism: 'Decreased hepatic OATP1B1 uptake transporter activity causing elevated systemic statin exposure.',
            clinicalRecommendation: 'High myopathy and rhabdomyolysis risk at >20mg daily dose. Switch to lower-risk statin.',
            alternativeOptions: ['Rosuvastatin 5-10mg daily', 'Pravastatin 20mg daily'],
            isReconciled: false,
          },
        ],
        phenoCalibrations: {
          targetSystolicBP: 125,
          targetDiastolicBP: 80,
          mandatoryNocturnalDippingPct: 10,
        },
        sequencingMeta: {
          platform: 'Illumina NovaSeq 6000',
          coverage: '30x Clinical WGS',
          panel: 'ClinVar + CPIC Guideline v2026',
        },
        lastAssessedAt: new Date(),
      });
      seededProfiles.push(await profileRepo.save(p));
    } else if (resident.uhid === 'RES-002') {
      // Eleanor Vance (79yo female, Alzheimer's & Sarcopenia)
      const p = profileRepo.create({
        residentId: resident.id,
        overallRiskTier: GeneticRiskTier.HIGH,
        prsScores: [
          {
            condition: "Late-Onset Alzheimer's Disease",
            percentile: 88.0,
            riskLevel: 'HIGH',
            oddsRatio: 2.15,
            snpsEvaluated: 64,
            clinicalTarget: 'Strict slow-wave deep sleep preservation (>90 min/night) and nocturnal hypoxia prevention.',
          },
          {
            condition: 'Age-Related Sarcopenia',
            percentile: 74.0,
            riskLevel: 'ELEVATED',
            oddsRatio: 1.48,
            snpsEvaluated: 95,
            clinicalTarget: 'Continuous contact-free fall detection and bedside gait stability monitoring.',
          },
          {
            condition: 'Coronary Artery Disease (CAD)',
            percentile: 46.0,
            riskLevel: 'AVERAGE',
            oddsRatio: 1.02,
            snpsEvaluated: 182,
            clinicalTarget: 'Standard blood pressure threshold (<130/85 mmHg).',
          },
        ],
        variants: [
          { gene: 'APOE', diplotype: 'e3/e4', phenotype: 'HIGH_RISK' },
          { gene: 'CYP2D6', diplotype: '*4/*4', phenotype: 'POOR' },
        ],
        activeMedications: ['Metoprolol', 'Donepezil'],
        activePgxAlerts: [
          {
            id: 'ALERT-CYP2D6-METOPROLOL',
            medication: 'Metoprolol',
            gene: 'CYP2D6',
            diplotype: '*4/*4',
            phenotype: 'POOR',
            severity: 'WARNING',
            cpicLevel: 'A',
            mechanism: 'Loss of functional CYP2D6 enzyme causes 5x accumulation of metoprolol serum levels.',
            clinicalRecommendation: 'Extreme bradycardia and orthostatic hypotension risk. Consider atenolol or 75% dose reduction.',
            alternativeOptions: ['Atenolol 25mg daily', 'Bisoprolol 2.5mg daily'],
            isReconciled: false,
          },
        ],
        phenoCalibrations: {
          minHeartRateAlert: 55,
          deepSleepTargetMinutes: 90,
        },
        sequencingMeta: {
          platform: 'Illumina NovaSeq 6000',
          coverage: '30x Clinical WGS',
          panel: 'ClinVar + CPIC Guideline v2026',
        },
        lastAssessedAt: new Date(),
      });
      seededProfiles.push(await profileRepo.save(p));
    } else if (resident.uhid === 'RES-003') {
      // Marcus Chen (68yo male, Longevity Protective)
      const p = profileRepo.create({
        residentId: resident.id,
        overallRiskTier: GeneticRiskTier.LOW,
        prsScores: [
          {
            condition: 'Coronary Artery Disease (CAD)',
            percentile: 24.0,
            riskLevel: 'LOW',
            oddsRatio: 0.68,
            snpsEvaluated: 182,
            clinicalTarget: 'Protective cardiovascular genetics. Standard maintenance wellness.',
          },
          {
            condition: 'Type 2 Diabetes (T2D)',
            percentile: 18.0,
            riskLevel: 'LOW',
            oddsRatio: 0.54,
            snpsEvaluated: 240,
            clinicalTarget: 'High insulin sensitivity allele profile.',
          },
          {
            condition: "Late-Onset Alzheimer's Disease",
            percentile: 15.0,
            riskLevel: 'LOW',
            oddsRatio: 0.48,
            snpsEvaluated: 64,
            clinicalTarget: 'APOE e3/e3 neutral baseline longevity profile.',
          },
        ],
        variants: [
          { gene: 'APOE', diplotype: 'e3/e3', phenotype: 'NORMAL' },
          { gene: 'CYP2C19', diplotype: '*1/*1', phenotype: 'NORMAL' },
          { gene: 'VKORC1', diplotype: '-1639G>A', phenotype: 'INTERMEDIATE' },
        ],
        activeMedications: ['Metformin 500mg BID'],
        activePgxAlerts: [],
        phenoCalibrations: {},
        sequencingMeta: {
          platform: 'Illumina NovaSeq 6000',
          coverage: '30x Clinical WGS',
          panel: 'ClinVar + CPIC Guideline v2026',
        },
        lastAssessedAt: new Date(),
      });
      seededProfiles.push(await profileRepo.save(p));
    } else if (resident.uhid === 'RES-004') {
      // Clara Oswald (65yo female, Circadian clock variant)
      const p = profileRepo.create({
        residentId: resident.id,
        overallRiskTier: GeneticRiskTier.MODERATE,
        prsScores: [
          {
            condition: 'Circadian Phase Disorder',
            percentile: 78.0,
            riskLevel: 'ELEVATED',
            oddsRatio: 1.62,
            snpsEvaluated: 52,
            clinicalTarget: 'PER3 4/4 repeat carrier; early morning light therapy recommended.',
          },
          {
            condition: 'Coronary Artery Disease (CAD)',
            percentile: 36.0,
            riskLevel: 'AVERAGE',
            oddsRatio: 0.88,
            snpsEvaluated: 182,
            clinicalTarget: 'Standard target parameters.',
          },
        ],
        variants: [
          { gene: 'PER3', diplotype: '4/4', phenotype: 'SHORT_PERIOD' },
          { gene: 'CYP2C9', diplotype: '*1/*1', phenotype: 'NORMAL' },
        ],
        activeMedications: ['Melatonin 1mg QHS'],
        activePgxAlerts: [],
        phenoCalibrations: {
          bedtimeWindowStart: 21,
          wakeupWindowStart: 5,
        },
        sequencingMeta: {
          platform: 'Illumina NovaSeq 6000',
          coverage: '30x Clinical WGS',
          panel: 'ClinVar + CPIC Guideline v2026',
        },
        lastAssessedAt: new Date(),
      });
      seededProfiles.push(await profileRepo.save(p));
    }
  }

  console.info(`Seeded ${seededProfiles.length} resident genomic profiles.`);
  return seededProfiles;
}
