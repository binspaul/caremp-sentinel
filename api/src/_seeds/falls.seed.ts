import { DataSource } from 'typeorm';
import {
  FallIncident,
  FallIncidentStatus,
  FallSeverity,
} from '../falls/entities/fall-incident.entity';
import { Resident } from '../residents/entities/resident.entity';
import { Band } from '../bands/entities/band.entity';

export async function seedFalls(dataSource: DataSource): Promise<FallIncident[]> {
  const fallRepo = dataSource.getRepository(FallIncident);
  const residentRepo = dataSource.getRepository(Resident);
  const bandRepo = dataSource.getRepository(Band);

  // Check if we already have seeded falls
  const count = await fallRepo.count();
  if (count > 0) {
    console.info(`Found ${count} fall incidents, skipping fall seeding.`);
    return await fallRepo.find();
  }

  // Find Eleanor Vance (RES-002)
  const eleanor = await residentRepo.findOne({ where: { uhid: 'RES-002' } });
  if (!eleanor) {
    console.warn('Eleanor Vance (RES-002) not found, skipping fall seeding.');
    return [];
  }

  // Find Eleanor's band if assigned
  const eleanorBand = await bandRepo.findOne({
    where: { assignedResidentId: eleanor.id },
  });

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const resolvedTime = new Date(Date.now() - 105 * 60 * 1000); // 15 mins after fall

  const historyIncident = fallRepo.create({
    residentId: eleanor.id,
    bandId: eleanorBand?.id || null,
    impactForceG: 3.2,
    orientationChangeDeg: 84.5,
    motionlessDurationSeconds: 40,
    severity: FallSeverity.SEVERE,
    status: FallIncidentStatus.RESOLVED_ASSISTED,
    location: eleanor.address ? `${eleanor.address} - En-Suite Bathroom` : 'En-Suite Bathroom',
    clinicalDescription:
      'Freeze-of-Gait Fall: Sudden 3.2g downward deceleration impact with 84.5 degree orientation tilt in resident with neurocognitive deficit. Zero micro-motion detected for 40 seconds post-impact.',
    detectedAt: twoHoursAgo,
    resolvedAt: resolvedTime,
    resolvedBy: 'Dr. Sarah Jenkins',
    resolutionNotes:
      'Emergency response team dispatched within 45s. Patient helped to sitting position. Mild right contusion, vitals stable (BP 124/78, HR 76). High fall-risk protocol engaged with bedside motion sensor verification.',
  });

  const saved = await fallRepo.save(historyIncident);
  console.info(`Successfully seeded fall incident ID #${saved.id} for ${eleanor.firstName} ${eleanor.lastName}.`);
  return [saved];
}
