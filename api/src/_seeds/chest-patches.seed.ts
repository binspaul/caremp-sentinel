import { DataSource } from 'typeorm';
import {
  ChestPatch,
  ChestPatchStatus,
  ChestPatchType,
  AdhesionStatus,
} from '../chest-patches/entities/chest-patch.entity';
import { Resident } from '../residents/entities/resident.entity';

export interface ChestPatchSeedData {
  serialNumber: string;
  macAddress: string;
  model: string;
  patchType: ChestPatchType;
  batteryLevel: number;
  adhesionStatus: AdhesionStatus;
  wearDurationDays: number;
  maxWearDays: number;
  skinTempCelsius: number | null;
  isWorn: boolean;
  rssi: number;
  status: ChestPatchStatus;
  firmwareVersion: string;
  targetResidentUhid?: string;
  notes: string;
}

export const CHEST_PATCH_SEED_DATA: ChestPatchSeedData[] = [
  {
    serialNumber: 'CP-001',
    macAddress: 'E2:15:B8:33:02:01',
    model: 'Sentinel Bio-Patch Hydrogel ECG v3',
    patchType: ChestPatchType.SINGLE_LEAD_ECG,
    batteryLevel: 92.0,
    adhesionStatus: AdhesionStatus.ADHERED,
    wearDurationDays: 3.2,
    maxWearDays: 7.0,
    skinTempCelsius: 36.8,
    isWorn: true,
    rssi: -62,
    status: ChestPatchStatus.ACTIVE,
    firmwareVersion: 'v3.0.2',
    targetResidentUhid: 'RES-001', // Alex Rivera
    notes: 'Continuous Lead-I ECG & real-time HRV vagal tone telemetry.',
  },
  {
    serialNumber: 'CP-002',
    macAddress: 'E2:15:B8:33:02:02',
    model: 'Sentinel Bio-Patch Hydrogel ECG v3',
    patchType: ChestPatchType.CARDIOPULMONARY,
    batteryLevel: 88.0,
    adhesionStatus: AdhesionStatus.ADHERED,
    wearDurationDays: 4.5,
    maxWearDays: 7.0,
    skinTempCelsius: 37.1,
    isWorn: true,
    rssi: -66,
    status: ChestPatchStatus.ACTIVE,
    firmwareVersion: 'v3.0.2',
    targetResidentUhid: 'RES-002', // Eleanor Vance
    notes: 'Dual-sensor cardiopulmonary acoustic & arrhythmia surveillance patch.',
  },
  {
    serialNumber: 'CP-003',
    macAddress: 'E2:15:B8:33:02:03',
    model: 'Sentinel Bio-Patch Hydrogel ECG v3',
    patchType: ChestPatchType.TEMP_RESPIRATION,
    batteryLevel: 95.0,
    adhesionStatus: AdhesionStatus.ADHERED,
    wearDurationDays: 1.8,
    maxWearDays: 7.0,
    skinTempCelsius: 36.6,
    isWorn: true,
    rssi: -58,
    status: ChestPatchStatus.ACTIVE,
    firmwareVersion: 'v3.0.2',
    targetResidentUhid: 'RES-003', // Marcus Chen
    notes: 'Continuous nocturnal core-body temperature gradient & thoracic effort.',
  },
  {
    serialNumber: 'CP-004',
    macAddress: 'E2:15:B8:33:02:04',
    model: 'Sentinel Bio-Patch Hydrogel ECG v3',
    patchType: ChestPatchType.SINGLE_LEAD_ECG,
    batteryLevel: 98.0,
    adhesionStatus: AdhesionStatus.ADHERED,
    wearDurationDays: 2.1,
    maxWearDays: 7.0,
    skinTempCelsius: 36.7,
    isWorn: true,
    rssi: -60,
    status: ChestPatchStatus.ACTIVE,
    firmwareVersion: 'v3.0.2',
    targetResidentUhid: 'RES-004', // Clara Oswald
    notes: 'Continuous ECG recording for orthostatic tachycardia screening.',
  },
  {
    serialNumber: 'CP-005',
    macAddress: 'E2:15:B8:33:02:05',
    model: 'Sentinel Bio-Patch Hydrogel ECG v3',
    patchType: ChestPatchType.SINGLE_LEAD_ECG,
    batteryLevel: 100.0,
    adhesionStatus: AdhesionStatus.ADHERED,
    wearDurationDays: 0.0,
    maxWearDays: 7.0,
    skinTempCelsius: null,
    isWorn: false,
    rssi: -40,
    status: ChestPatchStatus.CHARGING,
    firmwareVersion: 'v3.0.2',
    notes: 'Sanitized and docked on high-throughput charger. Fresh hydrogel layer mounted.',
  },
  {
    serialNumber: 'CP-006',
    macAddress: 'E2:15:B8:33:02:06',
    model: 'Sentinel Bio-Patch Hydrogel ECG v3',
    patchType: ChestPatchType.CARDIOPULMONARY,
    batteryLevel: 12.0,
    adhesionStatus: AdhesionStatus.REPLACEMENT_DUE,
    wearDurationDays: 6.9,
    maxWearDays: 7.0,
    skinTempCelsius: 36.4,
    isWorn: false,
    rssi: -84,
    status: ChestPatchStatus.DEPLETED,
    firmwareVersion: 'v2.9.8',
    notes: '7-day wear cycle complete. Hydrogel replacement required before clinical redeployment.',
  },
];

export async function seedChestPatches(dataSource: DataSource): Promise<ChestPatch[]> {
  const patchRepo = dataSource.getRepository(ChestPatch);
  const residentRepo = dataSource.getRepository(Resident);

  const existingPatches = await patchRepo.find();
  if (existingPatches.length > 0) {
    console.info(`[ChestPatches Seed] Found ${existingPatches.length} existing chest patches. Skipping seed.`);
    return existingPatches;
  }

  const residents = await residentRepo.find({ where: { isDeleted: false } });
  const residentMap = new Map<string, Resident>();
  residents.forEach((r) => residentMap.set(r.uhid, r));

  const savedPatches: ChestPatch[] = [];

  for (const item of CHEST_PATCH_SEED_DATA) {
    const assignedRes = item.targetResidentUhid
      ? residentMap.get(item.targetResidentUhid)
      : null;

    const patch = patchRepo.create({
      serialNumber: item.serialNumber,
      macAddress: item.macAddress,
      model: item.model,
      patchType: item.patchType,
      batteryLevel: item.batteryLevel,
      adhesionStatus: item.adhesionStatus,
      wearDurationDays: item.wearDurationDays,
      maxWearDays: item.maxWearDays,
      skinTempCelsius: item.skinTempCelsius,
      isWorn: item.isWorn,
      rssi: item.rssi,
      status: item.status,
      firmwareVersion: item.firmwareVersion,
      lastSeenAt: new Date(),
      notes: item.notes,
      isActive: true,
      isDeleted: false,
      assignedResidentId: assignedRes ? assignedRes.id : null,
    });

    const saved = await patchRepo.save(patch);
    savedPatches.push(saved);
  }

  console.info(`[ChestPatches Seed] Successfully seeded ${savedPatches.length} chest patches.`);
  return savedPatches;
}
