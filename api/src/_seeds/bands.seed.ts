import { DataSource, Repository } from 'typeorm';
import { Band, BandStatus } from '../bands/entities/band.entity';
import { Resident } from '../residents/entities/resident.entity';

export interface BandSeedData {
  serialNumber: string;
  macAddress: string;
  model: string;
  firmwareVersion: string;
  batteryLevel: number;
  isWorn: boolean;
  rssi: number;
  status: BandStatus;
  targetResidentUhid?: string;
  notes: string;
}

export const BAND_SEED_DATA: BandSeedData[] = [
  {
    serialNumber: 'BND-001',
    macAddress: 'C4:7D:4F:12:9A:01',
    model: 'Sentinel Bio-Band Pulse v2',
    firmwareVersion: 'v1.2.0',
    batteryLevel: 94.0,
    isWorn: true,
    rssi: -64,
    status: BandStatus.ACTIVE,
    targetResidentUhid: 'RES-001', // Alex Rivera
    notes: 'Dual-wavelength 660/940nm PPG optical sensor and 3-axis accelerometer active.',
  },
  {
    serialNumber: 'BND-002',
    macAddress: 'C4:7D:4F:12:9A:02',
    model: 'Sentinel Bio-Band Pulse v2',
    firmwareVersion: 'v1.2.0',
    batteryLevel: 91.0,
    isWorn: true,
    rssi: -72,
    status: BandStatus.ACTIVE,
    targetResidentUhid: 'RES-002', // Eleanor Vance
    notes: 'Arrhythmia detection enabled with fall-impact telemetry sensor.',
  },
  {
    serialNumber: 'BND-003',
    macAddress: 'C4:7D:4F:12:9A:03',
    model: 'Sentinel Bio-Band Pulse v2',
    firmwareVersion: 'v1.2.0',
    batteryLevel: 96.0,
    isWorn: true,
    rssi: -58,
    status: BandStatus.ACTIVE,
    targetResidentUhid: 'RES-003', // Marcus Chen
    notes: 'Wristband biometric sensor configured with nocturnal restless agitation tracker.',
  },
  {
    serialNumber: 'BND-004',
    macAddress: 'C4:7D:4F:12:9A:04',
    model: 'Sentinel Bio-Band Pulse v2',
    firmwareVersion: 'v1.2.0',
    batteryLevel: 98.0,
    isWorn: true,
    rssi: -61,
    status: BandStatus.ACTIVE,
    targetResidentUhid: 'RES-004', // Clara Oswald
    notes: 'Circadian sleep architecture protocol active; slow-wave deep sleep tracking.',
  },
  {
    serialNumber: 'BND-005',
    macAddress: 'C4:7D:4F:12:9A:05',
    model: 'Sentinel Bio-Band Pulse v2',
    firmwareVersion: 'v1.2.0',
    batteryLevel: 100.0,
    isWorn: false,
    rssi: -45,
    status: BandStatus.CHARGING,
    notes: 'Docked in Station A. Fully charged, sanitized, and ready for assignment.',
  },
  {
    serialNumber: 'BND-006',
    macAddress: 'C4:7D:4F:12:9A:06',
    model: 'Sentinel Bio-Band Pulse v2',
    firmwareVersion: 'v1.1.9',
    batteryLevel: 14.0,
    isWorn: false,
    rssi: -82,
    status: BandStatus.AVAILABLE,
    notes: 'Low battery warning. Pending dock recharge before clinical deployment.',
  },
];

export async function seedBands(dataSource: DataSource): Promise<Band[]> {
  const bandRepo = dataSource.getRepository(Band);
  const residentRepo = dataSource.getRepository(Resident);

  const existingBands = await bandRepo.find();
  if (existingBands.length > 0) {
    console.info(`[Bands Seed] Found ${existingBands.length} existing bands. Skipping seed.`);
    return existingBands;
  }

  const residents = await residentRepo.find({ where: { isDeleted: false } });
  const residentMap = new Map<string, Resident>();
  residents.forEach((r) => residentMap.set(r.uhid, r));

  const savedBands: Band[] = [];

  for (const item of BAND_SEED_DATA) {
    const assignedRes = item.targetResidentUhid
      ? residentMap.get(item.targetResidentUhid)
      : null;

    const band = bandRepo.create({
      serialNumber: item.serialNumber,
      macAddress: item.macAddress,
      model: item.model,
      firmwareVersion: item.firmwareVersion,
      batteryLevel: item.batteryLevel,
      isWorn: item.isWorn,
      rssi: item.rssi,
      status: item.status,
      lastSeenAt: new Date(),
      notes: item.notes,
      isActive: true,
      isDeleted: false,
      assignedResidentId: assignedRes ? assignedRes.id : null,
    });

    const saved = await bandRepo.save(band);
    savedBands.push(saved);
  }

  console.info(`[Bands Seed] Successfully seeded ${savedBands.length} wearable bio-bands.`);
  return savedBands;
}
