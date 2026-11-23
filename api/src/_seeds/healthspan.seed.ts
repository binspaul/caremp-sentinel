import { DataSource } from 'typeorm';
import {
  HealthspanAssessment,
  FrailtyClassification,
} from '../healthspan/entities/healthspan-assessment.entity';
import { Resident } from '../residents/entities/resident.entity';

export async function seedHealthspan(
  dataSource: DataSource,
): Promise<HealthspanAssessment[]> {
  const healthspanRepo = dataSource.getRepository(HealthspanAssessment);
  const residentRepo = dataSource.getRepository(Resident);

  const existingCount = await healthspanRepo.count();
  if (existingCount > 0) {
    console.info(
      `Found ${existingCount} healthspan assessments, skipping healthspan seeding.`,
    );
    return await healthspanRepo.find();
  }

  const residents = await residentRepo.find({ where: { isDeleted: false } });
  if (residents.length === 0) {
    console.warn('No residents found for healthspan seeding.');
    return [];
  }

  const now = new Date();
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const assessmentsToSave: HealthspanAssessment[] = [];

  for (const resident of residents) {
    if (resident.uhid === 'RES-001') {
      // Alex Rivera (72yo male, CAD & PGx conflict)
      assessmentsToSave.push(
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: d60,
          chronologicalAge: 72,
          biologicalAge: 75.8,
          biologicalAgeDelta: 3.8,
          frailtyIndex: 0.28,
          classification: FrailtyClassification.PRE_FRAIL,
          sarcopeniaRisk: 'MODERATE',
          mobilityCadenceScore: 64.0,
          autonomicResilience: 58.0,
          contributingDeficits: [
            'CAD Polygenic Burden (84th %tile)',
            'Reduced deep sleep slow-wave ratio',
            'Impaired statin uptake tolerance',
            'Gait cadence variability',
          ],
          longevityInterventions: [
            'Baseline pheno-genomic assessment',
            'Wearable band continuous telemetry enrollment',
          ],
          protocolPhase: 'baseline',
          source: 'rockwood-clock',
        }),
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: d30,
          chronologicalAge: 72,
          biologicalAge: 74.6,
          biologicalAgeDelta: 2.6,
          frailtyIndex: 0.24,
          classification: FrailtyClassification.PRE_FRAIL,
          sarcopeniaRisk: 'MODERATE',
          mobilityCadenceScore: 69.5,
          autonomicResilience: 64.0,
          contributingDeficits: [
            'CAD Polygenic Burden (84th %tile)',
            'Statin myopathy risk (SLCO1B1 521T>C)',
            'Mild nocturnal HRV depression',
          ],
          longevityInterventions: [
            'Initiated CPIC-guided medication review',
            'Prescribed progressive locomotor cadence intervals',
          ],
          protocolPhase: 'active_intervention',
          source: 'rockwood-clock',
        }),
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: now,
          chronologicalAge: 72,
          biologicalAge: 73.8,
          biologicalAgeDelta: 1.8,
          frailtyIndex: 0.21,
          classification: FrailtyClassification.PRE_FRAIL,
          sarcopeniaRisk: 'MODERATE',
          mobilityCadenceScore: 74.0,
          autonomicResilience: 69.0,
          contributingDeficits: [
            'CAD Polygenic Risk (calibrated systolic target <125 mmHg)',
            'Residual antiplatelet transition monitoring',
          ],
          longevityInterventions: [
            'Ticagrelor 90mg BID (PGx Reconciled)',
            'Pravastatin 20mg switch (SLCO1B1 safe)',
            'Slow-wave sleep acoustic neuromodulation protocol',
            'Daily 30-min targeted resistance cadence',
          ],
          protocolPhase: 'active_intervention',
          source: 'rockwood-clock',
        }),
      );
    } else if (resident.uhid === 'RES-002') {
      // Eleanor Vance (68yo female, Highly Robust)
      assessmentsToSave.push(
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: d60,
          chronologicalAge: 68,
          biologicalAge: 66.2,
          biologicalAgeDelta: -1.8,
          frailtyIndex: 0.11,
          classification: FrailtyClassification.ROBUST,
          sarcopeniaRisk: 'LOW',
          mobilityCadenceScore: 88.0,
          autonomicResilience: 84.0,
          contributingDeficits: ['Borderline bone mineral density'],
          longevityInterventions: [
            'Baseline biomarker calibration',
            'Zone 2 endurance cadence tracking',
          ],
          protocolPhase: 'baseline',
          source: 'rockwood-clock',
        }),
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: now,
          chronologicalAge: 68,
          biologicalAge: 65.4,
          biologicalAgeDelta: -2.6,
          frailtyIndex: 0.095,
          classification: FrailtyClassification.ROBUST,
          sarcopeniaRisk: 'LOW',
          mobilityCadenceScore: 91.5,
          autonomicResilience: 88.0,
          contributingDeficits: [],
          longevityInterventions: [
            'Zone 2 mitochondrial conditioning (150 min/wk)',
            'Circadian photoperiod synchronization',
            'Optimized lean-protein & polyphenol nutritional regimen',
          ],
          protocolPhase: 'optimized',
          source: 'rockwood-clock',
        }),
      );
    } else if (resident.uhid === 'RES-003') {
      // Marcus Chen (81yo male, High Fall & Frailty Risk)
      assessmentsToSave.push(
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: d60,
          chronologicalAge: 81,
          biologicalAge: 85.4,
          biologicalAgeDelta: 4.4,
          frailtyIndex: 0.38,
          classification: FrailtyClassification.FRAIL,
          sarcopeniaRisk: 'HIGH',
          mobilityCadenceScore: 48.0,
          autonomicResilience: 42.0,
          contributingDeficits: [
            'Slow gait speed (<0.65 m/s)',
            'Nocturnal autonomic depression (HRV <18 ms)',
            'High Sarcopenia polygenic score (88th %tile)',
            'Postural orthostatic blood pressure drops',
            'CYP2D6 polypharmacy clearance vulnerability',
          ],
          longevityInterventions: [
            'Comprehensive geriatric assessment',
            'Continuous band fall detection activation',
          ],
          protocolPhase: 'baseline',
          source: 'rockwood-clock',
        }),
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: d30,
          chronologicalAge: 81,
          biologicalAge: 84.8,
          biologicalAgeDelta: 3.8,
          frailtyIndex: 0.35,
          classification: FrailtyClassification.FRAIL,
          sarcopeniaRisk: 'HIGH',
          mobilityCadenceScore: 52.0,
          autonomicResilience: 46.5,
          contributingDeficits: [
            'Postural orthostatic stability deficit',
            'CYP2D6 metabolic rate restriction',
            'Gait velocity impairment',
          ],
          longevityInterventions: [
            'Postural stability & dual-task gait training',
            'CYP2D6 medication micro-titration',
          ],
          protocolPhase: 'active_intervention',
          source: 'rockwood-clock',
        }),
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: now,
          chronologicalAge: 81,
          biologicalAge: 84.1,
          biologicalAgeDelta: 3.1,
          frailtyIndex: 0.33,
          classification: FrailtyClassification.FRAIL,
          sarcopeniaRisk: 'HIGH',
          mobilityCadenceScore: 55.0,
          autonomicResilience: 49.0,
          contributingDeficits: [
            'Locomotion cadence attenuation',
            'Postural balance vulnerability during transfers',
          ],
          longevityInterventions: [
            'Gait stabilization biofeedback orthotics',
            'Circadian peptide timing for muscle protein synthesis',
            'Supervised isometric neuromuscular activation',
          ],
          protocolPhase: 'active_intervention',
          source: 'rockwood-clock',
        }),
      );
    } else if (resident.uhid === 'RES-004') {
      // Clara Oswald (65yo female, Resilient)
      assessmentsToSave.push(
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: d60,
          chronologicalAge: 65,
          biologicalAge: 63.8,
          biologicalAgeDelta: -1.2,
          frailtyIndex: 0.08,
          classification: FrailtyClassification.ROBUST,
          sarcopeniaRisk: 'LOW',
          mobilityCadenceScore: 86.0,
          autonomicResilience: 82.0,
          contributingDeficits: [],
          longevityInterventions: ['Preventative longevity baseline screening'],
          protocolPhase: 'baseline',
          source: 'rockwood-clock',
        }),
        healthspanRepo.create({
          residentId: resident.id,
          generatedAt: now,
          chronologicalAge: 65,
          biologicalAge: 62.9,
          biologicalAgeDelta: -2.1,
          frailtyIndex: 0.07,
          classification: FrailtyClassification.ROBUST,
          sarcopeniaRisk: 'LOW',
          mobilityCadenceScore: 89.0,
          autonomicResilience: 85.5,
          contributingDeficits: [],
          longevityInterventions: [
            'High-intensity interval cadence preservation',
            'Anti-inflammatory polyphenol nutrition protocol',
          ],
          protocolPhase: 'optimized',
          source: 'rockwood-clock',
        }),
      );
    }
  }

  const saved = await healthspanRepo.save(assessmentsToSave);
  console.info(`Successfully seeded ${saved.length} healthspan assessment trajectories.`);
  return saved;
}
