import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Title } from '../users/entities/user.entity';
import { Resident, SleepStatus, WeightUnit, HeightUnit, TemperatureUnit } from '../residents/entities/resident.entity';
import { Vital, Status as VitalStatus, Priority as VitalPriority, TemperatureUnit as VitalTempUnit } from '../vitals/entities/vital.entity';
import { Role, RoleName } from '../auth/interfaces/role.interface';

export interface ResidentSeedData {
  user: {
    emailAddress: string;
    passwordPlain: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    phoneNumber: string;
    gender: number;
    description: string;
  };
  resident: {
    uhid: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    emergencyContactNumber: string;
    age: number;
    gender: number;
    bloodGroupId: number;
    description: string;
    notes: string;
    specialNotes: string;
    referenceHeartRate: number;
    heartRateTolerance: number;
    referenceHrv: number;
    hrvTolerance: number;
    referenceSystolicBP: number;
    systolicBPTolerance: number;
    referenceDiastolicBP: number;
    diastolicBPTolerance: number;
    referenceOxygenSaturation: number;
    oxygenSaturationTolerance: number;
    referenceBodyTemperature: number;
    temperatureToleranceCelsius: number;
    referenceDeepSleep: number;
    referenceLightSleep: number;
    referenceRemSleep: number;
    heightCm: number;
    weight: number;
  };
  baselineVital: {
    heartRate: number;
    hrv: number;
    systolicBP: number;
    diastolicBP: number;
    oxygenSaturation: number;
    bodyTemperature: number;
    batteryLevel: number;
    payload: Record<string, any>;
  };
}

export const ALEX_RIVERA_SEED: ResidentSeedData = {
  user: {
    emailAddress: 'resident@caremp.ai',
    passwordPlain: 'resident@123#',
    firstName: 'Eleanor',
    middleName: '',
    lastName: 'Vance',
    phoneNumber: '+1-555-019-2831',
    gender: 2,
    description: 'Resident with FAST Stage 5 Moderate Alzheimer\'s Disease, sundowning agitation, and circadian sleep inversion. Former elementary school librarian for 32 years.',
  },
  resident: {
    uhid: 'RES-001',
    firstName: 'Eleanor',
    middleName: '',
    lastName: 'Vance',
    emailAddress: 'resident@caremp.ai',
    phoneNumber: '+1-555-019-2831',
    emergencyContactNumber: '+1-555-019-9999',
    age: 78,
    gender: 2,
    bloodGroupId: 1, // O+
    description: 'Resident with FAST Stage 5 Moderate Alzheimer\'s Disease, sundowning agitation, and circadian sleep inversion. Former elementary school librarian for 32 years.',
    notes: 'Active medications: Donepezil 5mg daily. Monitored for sundowning agitation, circadian rhythm inversion, and hallway pacing.',
    specialNotes: 'Personalized anchors: Lavender knit blanket, Glen Miller big-band jazz, library book sorting. Rule out UTI if acute agitation occurs.',
    referenceHeartRate: 72.0,
    heartRateTolerance: 15.0,
    referenceHrv: 45.0,
    hrvTolerance: 15.0,
    referenceSystolicBP: 118,
    systolicBPTolerance: 15.0,
    referenceDiastolicBP: 76,
    diastolicBPTolerance: 10.0,
    referenceOxygenSaturation: 98.4,
    oxygenSaturationTolerance: 3.0,
    referenceBodyTemperature: 36.8,
    temperatureToleranceCelsius: 1.0,
    referenceDeepSleep: 65,
    referenceLightSleep: 240,
    referenceRemSleep: 90,
    heightCm: 175.0,
    weight: 74.0,
  },
  baselineVital: {
    heartRate: 72.0,
    hrv: 46.0,
    systolicBP: 118.0,
    diastolicBP: 76.0,
    oxygenSaturation: 98.4,
    bodyTemperature: 36.8,
    batteryLevel: 94.0,
    payload: {
      sensorSource: 'hardware_pod_v1',
      deviceModel: '60GHz_mmWave_Radar_PPG_Cluster',
      prsCADPercentile: 84.0,
      cpicHighRiskFlags: ['CYP2C19_Clopidogrel', 'SLCO1B1_Atorvastatin'],
      news2Score: 0,
      status: 'Baseline Stable',
    },
  },
};

export const ELEANOR_VANCE_SEED: ResidentSeedData = {
  user: {
    emailAddress: 'eleanor.vance@caremp.ai',
    passwordPlain: 'resident@123#',
    firstName: 'Eleanor',
    middleName: '',
    lastName: 'Vance',
    phoneNumber: '+1-555-019-2832',
    gender: 2,
    description: 'Geriatric longevity cohort participant with high frailty index (e-FI 0.38) and paroxysmal arrhythmia history.',
  },
  resident: {
    uhid: 'RES-002',
    firstName: 'Eleanor',
    middleName: '',
    lastName: 'Vance',
    emailAddress: 'eleanor.vance@caremp.ai',
    phoneNumber: '+1-555-019-2832',
    emergencyContactNumber: '+1-555-019-8888',
    age: 78,
    gender: 2,
    bloodGroupId: 2, // A+
    description: 'Geriatric longevity cohort participant with high frailty index (e-FI 0.38), paroxysmal arrhythmia history, and CYP2D6 poor metabolizer profile.',
    notes: 'Active medications: Metoprolol Tartrate 25mg BID, Apixaban 5mg BID. Fall risk mitigation in place.',
    specialNotes: 'Mobility assistance required. Orthostatic hypotension precautions.',
    referenceHeartRate: 76.0,
    heartRateTolerance: 18.0,
    referenceHrv: 28.0,
    hrvTolerance: 10.0,
    referenceSystolicBP: 132,
    systolicBPTolerance: 20.0,
    referenceDiastolicBP: 82,
    diastolicBPTolerance: 12.0,
    referenceOxygenSaturation: 96.5,
    oxygenSaturationTolerance: 4.0,
    referenceBodyTemperature: 36.7,
    temperatureToleranceCelsius: 1.2,
    referenceDeepSleep: 45,
    referenceLightSleep: 260,
    referenceRemSleep: 70,
    heightCm: 162.0,
    weight: 61.0,
  },
  baselineVital: {
    heartRate: 76.0,
    hrv: 29.0,
    systolicBP: 130.0,
    diastolicBP: 82.0,
    oxygenSaturation: 96.5,
    bodyTemperature: 36.7,
    batteryLevel: 91.0,
    payload: {
      sensorSource: 'hardware_pod_v1',
      frailtyIndex: 0.38,
      bioAgeDeltaYears: 3.8,
      news2Score: 1,
      status: 'Pre-frail Surveillance',
    },
  },
};

export const MARCUS_CHEN_SEED: ResidentSeedData = {
  user: {
    emailAddress: 'marcus.chen@caremp.ai',
    passwordPlain: 'resident@123#',
    firstName: 'Marcus',
    middleName: '',
    lastName: 'Chen',
    phoneNumber: '+1-555-019-2833',
    gender: 1,
    description: 'Hypertensive & metabolic syndrome surveillance participant monitored via $45 contact-free 60-GHz mmWave radar bedside cluster.',
  },
  resident: {
    uhid: 'RES-003',
    firstName: 'Marcus',
    middleName: '',
    lastName: 'Chen',
    emailAddress: 'marcus.chen@caremp.ai',
    phoneNumber: '+1-555-019-2833',
    emergencyContactNumber: '+1-555-019-7777',
    age: 68,
    gender: 1,
    bloodGroupId: 3, // B+
    description: 'Hypertensive & metabolic syndrome surveillance participant monitored via $45 contact-free 60-GHz mmWave radar bedside cluster.',
    notes: 'Active medications: Lisinopril 20mg daily, Metformin 500mg BID. VKORC1 Warfarin sensitivity documented.',
    specialNotes: 'Monitored for reverse dipper sleep patterns and nocturnal hypertension spikes.',
    referenceHeartRate: 68.0,
    heartRateTolerance: 14.0,
    referenceHrv: 52.0,
    hrvTolerance: 18.0,
    referenceSystolicBP: 124,
    systolicBPTolerance: 16.0,
    referenceDiastolicBP: 80,
    diastolicBPTolerance: 10.0,
    referenceOxygenSaturation: 97.8,
    oxygenSaturationTolerance: 3.0,
    referenceBodyTemperature: 36.6,
    temperatureToleranceCelsius: 1.0,
    referenceDeepSleep: 75,
    referenceLightSleep: 230,
    referenceRemSleep: 85,
    heightCm: 172.0,
    weight: 79.0,
  },
  baselineVital: {
    heartRate: 68.0,
    hrv: 54.0,
    systolicBP: 124.0,
    diastolicBP: 80.0,
    oxygenSaturation: 98.0,
    bodyTemperature: 36.6,
    batteryLevel: 96.0,
    payload: {
      sensorSource: 'hardware_pod_v1',
      radarFrequencyHz: 60500000000,
      metabolicRiskTier: 'MODERATE',
      news2Score: 0,
      status: 'Contact-Free Radar Active',
    },
  },
};

export const CLARA_OSWALD_SEED: ResidentSeedData = {
  user: {
    emailAddress: 'clara.oswald@caremp.ai',
    passwordPlain: 'resident@123#',
    firstName: 'Clara',
    middleName: '',
    lastName: 'Oswald',
    phoneNumber: '+1-555-019-2834',
    gender: 2,
    description: 'Neuro-longevity cohort participant; APOE e4 carrier on specialized circadian sleep architecture protocol.',
  },
  resident: {
    uhid: 'RES-004',
    firstName: 'Clara',
    middleName: '',
    lastName: 'Oswald',
    emailAddress: 'clara.oswald@caremp.ai',
    phoneNumber: '+1-555-019-2834',
    emergencyContactNumber: '+1-555-019-6666',
    age: 74,
    gender: 2,
    bloodGroupId: 4, // AB+
    description: 'Neuro-longevity cohort participant; APOE e4 carrier on specialized circadian sleep architecture protocol.',
    notes: 'Active medications: Donepezil 5mg QHS, Calcium Citrate + Vit D3 daily. Cognitive resilience exercises daily.',
    specialNotes: 'APOE e3/e4 heterozygote. Prioritized for deep slow-wave sleep duration and glymphatic clearance.',
    referenceHeartRate: 70.0,
    heartRateTolerance: 12.0,
    referenceHrv: 48.0,
    hrvTolerance: 14.0,
    referenceSystolicBP: 120,
    systolicBPTolerance: 15.0,
    referenceDiastolicBP: 78,
    diastolicBPTolerance: 10.0,
    referenceOxygenSaturation: 98.0,
    oxygenSaturationTolerance: 2.5,
    referenceBodyTemperature: 36.9,
    temperatureToleranceCelsius: 0.8,
    referenceDeepSleep: 60,
    referenceLightSleep: 250,
    referenceRemSleep: 95,
    heightCm: 165.0,
    weight: 64.0,
  },
  baselineVital: {
    heartRate: 70.0,
    hrv: 49.0,
    systolicBP: 120.0,
    diastolicBP: 78.0,
    oxygenSaturation: 98.2,
    bodyTemperature: 36.9,
    batteryLevel: 98.0,
    payload: {
      sensorSource: 'hardware_pod_v1',
      apoeGenotype: 'e3/e4',
      glymphaticScore: 82.5,
      news2Score: 0,
      status: 'Circadian Architecture Active',
    },
  },
};

export const RESIDENT_SEED_DATA: ResidentSeedData[] = [
  ALEX_RIVERA_SEED,
  ELEANOR_VANCE_SEED,
  MARCUS_CHEN_SEED,
  CLARA_OSWALD_SEED,
];

function resolveRepos(
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
) {
  let userRepo: Repository<User>;
  let residentRepo: Repository<Resident>;
  let vitalRepo: Repository<Vital> | undefined;

  if ('getRepository' in dataSourceOrUserRepo) {
    userRepo = dataSourceOrUserRepo.getRepository(User);
    residentRepo = dataSourceOrUserRepo.getRepository(Resident);
    vitalRepo = dataSourceOrUserRepo.getRepository(Vital);
  } else {
    userRepo = dataSourceOrUserRepo;
    residentRepo = residentRepoArg!;
    vitalRepo = vitalRepoArg;
  }

  return { userRepo, residentRepo, vitalRepo };
}

export async function seedSingleResident(
  item: ResidentSeedData,
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
): Promise<{ user: User; resident: Resident }> {
  const { userRepo, residentRepo, vitalRepo } = resolveRepos(
    dataSourceOrUserRepo,
    residentRepoArg,
    vitalRepoArg,
  );

  // 1. Find or create User
  let user = await userRepo.findOne({
    where: { emailAddress: item.user.emailAddress },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(item.user.passwordPlain, 10);

    user = userRepo.create({
      firstName: item.user.firstName,
      middleName: item.user.middleName || '',
      lastName: item.user.lastName,
      description: item.user.description,
      emailAddress: item.user.emailAddress,
      phoneNumber: item.user.phoneNumber,
      password: hashedPassword,
      roleName: RoleName.RESIDENT,
      roleId: Role.RESIDENT,
      gender: item.user.gender,
      isVerified: true,
      isActive: true,
      isDeleted: false,
      title: Title.MR,
      countryId: 1,
    });

    await userRepo.save(user);
    console.log(`[Seed] Created User account: ${user.emailAddress} (Role: resident)`);
  } else {
    console.log(`[Seed] User account already exists: ${user.emailAddress}`);
  }

  // 2. Find or create Resident
  let resident = await residentRepo.findOne({
    where: { emailAddress: item.resident.emailAddress },
  });

  if (!resident) {
    resident = residentRepo.create({
      uhid: item.resident.uhid,
      firstName: item.resident.firstName,
      middleName: item.resident.middleName || '',
      lastName: item.resident.lastName,
      emailAddress: item.resident.emailAddress,
      phoneNumber: item.resident.phoneNumber,
      emergencyContactNumber: item.resident.emergencyContactNumber,
      age: item.resident.age,
      gender: item.resident.gender,
      bloodGroupId: item.resident.bloodGroupId,
      description: item.resident.description,
      notes: item.resident.notes,
      specialNotes: item.resident.specialNotes,
      referenceHeartRate: item.resident.referenceHeartRate,
      heartRateTolerance: item.resident.heartRateTolerance,
      referenceHrv: item.resident.referenceHrv,
      hrvTolerance: item.resident.hrvTolerance,
      referenceSystolicBP: item.resident.referenceSystolicBP,
      systolicBPTolerance: item.resident.systolicBPTolerance,
      referenceDiastolicBP: item.resident.referenceDiastolicBP,
      diastolicBPTolerance: item.resident.diastolicBPTolerance,
      referenceOxygenSaturation: item.resident.referenceOxygenSaturation,
      oxygenSaturationTolerance: item.resident.oxygenSaturationTolerance,
      referenceBodyTemperature: item.resident.referenceBodyTemperature,
      temperatureToleranceCelsius: item.resident.temperatureToleranceCelsius,
      referenceDeepSleep: item.resident.referenceDeepSleep,
      referenceLightSleep: item.resident.referenceLightSleep,
      referenceRemSleep: item.resident.referenceRemSleep,
      referenceSleepStatus: SleepStatus.AWAKE,
      heightCm: item.resident.heightCm,
      heightUnit: HeightUnit.CM,
      weight: item.resident.weight,
      weightUnit: WeightUnit.KG,
      status: 1,
      isActive: true,
      isDeleted: false,
      userId: user.id,
      createdBy: user.id,
    });

    await residentRepo.save(resident);
    console.log(`[Seed] Created Resident record: ${resident.firstName} ${resident.lastName} (UHID: ${resident.uhid})`);
  } else {
    console.log(`[Seed] Resident already exists: ${resident.firstName} ${resident.lastName} (UHID: ${resident.uhid})`);
  }

  // 3. Seed initial baseline vital telemetry if none exists
  if (vitalRepo) {
    const existingVital = await vitalRepo.findOne({
      where: { residentId: resident.id },
    });

    if (!existingVital) {
      const vital = vitalRepo.create({
        residentId: resident.id,
        heartRate: item.baselineVital.heartRate,
        hrv: item.baselineVital.hrv,
        systolicBP: item.baselineVital.systolicBP,
        diastolicBP: item.baselineVital.diastolicBP,
        oxygenSaturation: item.baselineVital.oxygenSaturation,
        bodyTemperature: item.baselineVital.bodyTemperature,
        batteryLevel: item.baselineVital.batteryLevel,
        temperatureUnit: VitalTempUnit.CELSIUS,
        sleepStatus: SleepStatus.AWAKE,
        payload: item.baselineVital.payload,
        generatedAt: new Date(),
        createdAt: new Date(),
      });

      await vitalRepo.save(vital);
      console.log(`[Seed] Created Baseline Vital record for ${resident.firstName} ${resident.lastName}`);
    }
  }

  return { user, resident };
}

// Named Individual Helpers (matching seedSuperAdmin / seedDoctorAdmin style)
export async function seedAlexRivera(
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
) {
  return seedSingleResident(ALEX_RIVERA_SEED, dataSourceOrUserRepo, residentRepoArg, vitalRepoArg);
}

export async function seedEleanorVance(
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
) {
  return seedSingleResident(ELEANOR_VANCE_SEED, dataSourceOrUserRepo, residentRepoArg, vitalRepoArg);
}

export async function seedMarcusChen(
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
) {
  return seedSingleResident(MARCUS_CHEN_SEED, dataSourceOrUserRepo, residentRepoArg, vitalRepoArg);
}

export async function seedClaraOswald(
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
) {
  return seedSingleResident(CLARA_OSWALD_SEED, dataSourceOrUserRepo, residentRepoArg, vitalRepoArg);
}

// Bulk Cohort Seeder
export async function seedResidents(
  dataSourceOrUserRepo: DataSource | Repository<User>,
  residentRepoArg?: Repository<Resident>,
  vitalRepoArg?: Repository<Vital>,
) {
  const seededResidents: Resident[] = [];

  for (const item of RESIDENT_SEED_DATA) {
    const { resident } = await seedSingleResident(
      item,
      dataSourceOrUserRepo,
      residentRepoArg,
      vitalRepoArg,
    );
    seededResidents.push(resident);
  }

  console.log(`[Seed] Successfully seeded ${seededResidents.length} care recipients.`);
  return seededResidents;
}
