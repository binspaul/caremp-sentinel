import { DataSource } from 'typeorm';
import {
  RadarPod,
  RadarPodStatus,
  RadarInstallationType,
} from '../radar-pods/entities/radar-pod.entity';
import { Resident } from '../residents/entities/resident.entity';

export interface RadarPodSeedData {
  serialNumber: string;
  macAddress: string;
  model: string;
  frequencyBand: string;
  installationType: RadarInstallationType;
  detectionRangeMeters: number;
  respirationRateBpm: number | null;
  heartRateBpm: number | null;
  bedOccupancy: boolean;
  firmwareVersion: string;
  powerSource: string;
  status: RadarPodStatus;
  roomNumber: string;
  targetResidentUhid?: string;
  notes: string;
}

export const RADAR_POD_SEED_DATA: RadarPodSeedData[] = [
  {
    serialNumber: 'RDR-001',
    macAddress: 'D4:8A:FC:21:01:01',
    model: 'Sentinel 60GHz FMCW Radar Pod v2',
    frequencyBand: '60 GHz FMCW',
    installationType: RadarInstallationType.BEDHEAD,
    detectionRangeMeters: 5.0,
    respirationRateBpm: 16.5,
    heartRateBpm: 68.0,
    bedOccupancy: true,
    firmwareVersion: 'v2.1.4',
    powerSource: 'ac_line_battery_backup',
    status: RadarPodStatus.ACTIVE,
    roomNumber: 'Suite 201',
    targetResidentUhid: 'RES-001', // Alex Rivera
    notes: 'Bedhead contact-free ballistocardiography and continuous nocturnal respiration monitoring.',
  },
  {
    serialNumber: 'RDR-002',
    macAddress: 'D4:8A:FC:21:01:02',
    model: 'Sentinel 60GHz FMCW Radar Pod v2',
    frequencyBand: '60 GHz FMCW',
    installationType: RadarInstallationType.BEDHEAD,
    detectionRangeMeters: 5.0,
    respirationRateBpm: 18.2,
    heartRateBpm: 72.0,
    bedOccupancy: true,
    firmwareVersion: 'v2.1.4',
    powerSource: 'ac_line_battery_backup',
    status: RadarPodStatus.ACTIVE,
    roomNumber: 'Suite 204',
    targetResidentUhid: 'RES-002', // Eleanor Vance
    notes: 'High-sensitivity sleep apnea & nocturnal respiration dip detection enabled.',
  },
  {
    serialNumber: 'RDR-003',
    macAddress: 'D4:8A:FC:21:01:03',
    model: 'Sentinel 60GHz FMCW Radar Pod v2',
    frequencyBand: '60 GHz FMCW',
    installationType: RadarInstallationType.BEDHEAD,
    detectionRangeMeters: 5.0,
    respirationRateBpm: 19.0,
    heartRateBpm: 74.0,
    bedOccupancy: true,
    firmwareVersion: 'v2.1.4',
    powerSource: 'ac_line_battery_backup',
    status: RadarPodStatus.ACTIVE,
    roomNumber: 'Suite 208',
    targetResidentUhid: 'RES-003', // Marcus Chen
    notes: 'Contact-free ballistocardiography calibrated for Lewy Body nocturnal motor symptoms.',
  },
  {
    serialNumber: 'RDR-004',
    macAddress: 'D4:8A:FC:21:01:04',
    model: 'Sentinel 60GHz FMCW Radar Pod v2',
    frequencyBand: '60 GHz FMCW',
    installationType: RadarInstallationType.CEILING,
    detectionRangeMeters: 7.0,
    respirationRateBpm: 15.8,
    heartRateBpm: 66.0,
    bedOccupancy: false,
    firmwareVersion: 'v2.1.2',
    powerSource: 'poe_ethernet',
    status: RadarPodStatus.ACTIVE,
    roomNumber: 'Suite 103',
    targetResidentUhid: 'RES-004', // Clara Oswald
    notes: 'Overhead micro-motion radar for fall-from-bed and ambient room presence.',
  },
  {
    serialNumber: 'RDR-005',
    macAddress: 'D4:8A:FC:21:01:05',
    model: 'Sentinel 60GHz FMCW Radar Pod v2',
    frequencyBand: '60 GHz FMCW',
    installationType: RadarInstallationType.BEDHEAD,
    detectionRangeMeters: 5.0,
    respirationRateBpm: null,
    heartRateBpm: null,
    bedOccupancy: false,
    firmwareVersion: 'v2.1.4',
    powerSource: 'ac_line_battery_backup',
    status: RadarPodStatus.STANDBY,
    roomNumber: 'Suite 202',
    notes: 'Calibrated and on standby for new resident admission.',
  },
  {
    serialNumber: 'RDR-006',
    macAddress: 'D4:8A:FC:21:01:06',
    model: 'Sentinel 60GHz FMCW Radar Pod v2',
    frequencyBand: '60 GHz FMCW',
    installationType: RadarInstallationType.WALL_MOUNT,
    detectionRangeMeters: 4.5,
    respirationRateBpm: null,
    heartRateBpm: null,
    bedOccupancy: false,
    firmwareVersion: 'v2.0.8',
    powerSource: 'ac_line_battery_backup',
    status: RadarPodStatus.MAINTENANCE,
    roomNumber: 'Suite 210',
    notes: 'Firmware upgrade pending. Antenna array recalibration required.',
  },
];

export async function seedRadarPods(dataSource: DataSource): Promise<RadarPod[]> {
  const radarRepo = dataSource.getRepository(RadarPod);
  const residentRepo = dataSource.getRepository(Resident);

  const existingPods = await radarRepo.find();
  if (existingPods.length > 0) {
    console.info(`[RadarPods Seed] Found ${existingPods.length} existing radar pods. Skipping seed.`);
    return existingPods;
  }

  const residents = await residentRepo.find({ where: { isDeleted: false } });
  const residentMap = new Map<string, Resident>();
  residents.forEach((r) => residentMap.set(r.uhid, r));

  const savedPods: RadarPod[] = [];

  for (const item of RADAR_POD_SEED_DATA) {
    const assignedRes = item.targetResidentUhid
      ? residentMap.get(item.targetResidentUhid)
      : null;

    const pod = radarRepo.create({
      serialNumber: item.serialNumber,
      macAddress: item.macAddress,
      model: item.model,
      frequencyBand: item.frequencyBand,
      installationType: item.installationType,
      detectionRangeMeters: item.detectionRangeMeters,
      respirationRateBpm: item.respirationRateBpm,
      heartRateBpm: item.heartRateBpm,
      bedOccupancy: item.bedOccupancy,
      firmwareVersion: item.firmwareVersion,
      powerSource: item.powerSource,
      status: item.status,
      roomNumber: item.roomNumber,
      lastHeartbeatAt: new Date(),
      notes: item.notes,
      isActive: true,
      isDeleted: false,
      assignedResidentId: assignedRes ? assignedRes.id : null,
    });

    const saved = await radarRepo.save(pod);
    savedPods.push(saved);
  }

  console.info(`[RadarPods Seed] Successfully seeded ${savedPods.length} radar pods.`);
  return savedPods;
}
