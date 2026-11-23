import { DataSource, Repository } from 'typeorm';
import { Band, BandStatus, BandDeviceType } from '../bands/entities/band.entity';
import { Resident } from '../residents/entities/resident.entity';

export interface BandSeedData {
  serialNumber: string;
  macAddress: string;
  model: string;
  deviceType: BandDeviceType;
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
    model: 'Sentinel Low-Cost Bio-Pod v1',
    deviceType: BandDeviceType.WRISTBAND,
    firmwareVersion: 'v1.2.0',
    batteryLevel: 94.0,
    isWorn: true,
    rssi: -64,
    status: BandStatus.ACTIVE,
    targetResidentUhid: 'RES-001', // Alex Rivera
    notes: 'Dual-wavelength 660/940nm PPG and 3-axis accelerometer active.',
  },
  {
    serialNumber: 'BND-002',
    macAddress: 'C4:7D:4F:12:9A:02',
    model: 'Sentinel Low-Cost Bio-Pod v1',
    deviceType: BandDeviceType.WRISTBAND,
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
    model: 'Sentinel 60GHz FMCW Radar Pod',
    deviceType: BandDeviceType.RADAR_POD,
    firmwareVersion: 'v2.0.1',
    batteryLevel: 96.0,
    isWorn: true,
    rssi: -58,
    status: BandStatus.ACTIVE,
    targetResidentUhid: 'RES-003', // Marcus Chen
    notes: 'Bedhead contact-free ballistocardiography and continuous nocturnal respiration monitoring.',
  },
  {
    serialNumber: 'BND-004',
    macAddress: 'C4:7D:4F:12:9A:04',
    model: 'Sentinel Low-Cost Bio-Pod v1',
    deviceType: BandDeviceType.WRISTBAND,
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
    model: 'Sentinel Low-Cost Bio-Pod v1',
    deviceType: BandDeviceType.WRISTBAND,
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
    model: 'Sentinel Low-Cost Bio-Pod v1',
    deviceType: BandDeviceType.WRISTBAND,
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

  const seededBands: Band[] = [];

  for (const item of BAND_SEED_DATA) {
    let band = await bandRepo.findOne({
      where: { serialNumber: item.serialNumber },
    });

    let assignedResidentId: number | null = null;

    if (item.targetResidentUhid) {
      const resident = await residentRepo.findOne({
        where: { uhid: item.targetResidentUhid, isDeleted: false },
      });
      if (resident) {
        assignedResidentId = resident.id;
      }
    }

    if (!band) {
      band = bandRepo.create({
        serialNumber: item.serialNumber,
        macAddress: item.macAddress,
        model: item.model,
        deviceType: item.deviceType,
        firmwareVersion: item.firmwareVersion,
        batteryLevel: item.batteryLevel,
        isWorn: item.isWorn,
        rssi: item.rssi,
        status: assignedResidentId ? BandStatus.ACTIVE : item.status,
        assignedResidentId,
        notes: item.notes,
        lastSeenAt: new Date(),
        isActive: true,
        isDeleted: false,
      });

      await bandRepo.save(band);
      console.log(`[Seed] Created Band: ${band.serialNumber} (${band.model})`);
    } else {
      if (assignedResidentId && !band.assignedResidentId) {
        band.assignedResidentId = assignedResidentId;
        band.status = BandStatus.ACTIVE;
        await bandRepo.save(band);
      }
      console.log(`[Seed] Band already exists: ${band.serialNumber}`);
    }

    seededBands.push(band);
  }

  console.log(`[Seed] Successfully seeded ${seededBands.length} hardware sensor bands.`);
  return seededBands;
}
