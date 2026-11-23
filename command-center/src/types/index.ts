// ==========================================
// User & Auth Types
// ==========================================

export interface User {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
  roleName: 'superadmin' | 'admin' | 'resident' | string;
  roleId: number;
  gender?: number;
  avatar?: string;
  isVerified?: boolean;
  isActive: boolean;
  createdAt?: string;
  personId?: number | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  code: number;
  status: 'success' | 'error';
  message: string;
  data: T;
  pagination?: {
    total: number;
    skip: number;
    limit: number;
  };
}

// ==========================================
// Resident Types
// ==========================================

export interface Resident {
  id: number;
  uhid: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  description?: string;
  emailAddress: string;
  phoneNumber: string;
  age: number;
  gender: number; // 1 = Male, 2 = Female
  status: number; // 1 = Active, 0 = Inactive
  emergencyContactNumber?: string;
  address?: string;
  referenceHeartRate?: number;
  referenceHrv?: number;
  referenceSystolicBP?: number;
  referenceDiastolicBP?: number;
  referenceOxygenSaturation?: number;
  referenceBodyTemperature?: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Vital Types
// ==========================================

export enum SleepStatus {
  UNKNOWN = 0,
  AWAKE = 1,
  LIGHT_SLEEP = 2,
  DEEP_SLEEP = 3,
}

export enum TemperatureUnit {
  UNKNOWN = 0,
  FAHRENHEIT = 1,
  CELSIUS = 2,
}

export interface Vital {
  id: number;
  residentId: number;
  generatedAt: string;
  heartRate: number;
  hrv: number;
  systolicBP: number;
  diastolicBP: number;
  oxygenSaturation: number;
  bodyTemperature: number;
  skinTemperature?: number;
  temperatureUnit?: TemperatureUnit;
  batteryLevel?: number;
  deepSleepTime?: number;
  lightSleepTime?: number;
  remSleepTime?: number;
  awakeSleepTime?: number;
  totalSleepTime?: number;
  sleepStatus?: SleepStatus;
  movementDetected?: boolean;
  wearingIndicator?: boolean;
  payload?: Record<string, any>;
  createdAt?: string;
  resident?: Resident;
}

// ==========================================
// Dashboard Counter Types
// ==========================================

export interface DashboardCounters {
  residentsTotal: number;
  residentsActive: number;
  vitalsTotal: number;
  vitalsRecentCount: number;
  usersTotal: number;
  usersActive: number;
  lastUpdated: Date;
}

// ==========================================
// Hardware Band / Device Fleet Types
// ==========================================

export type BandStatus = 'available' | 'active' | 'charging' | 'maintenance';
export type BandDeviceType = 'wristband' | 'radar_pod' | 'chest_patch';

export interface Band {
  id: number;
  serialNumber: string;
  macAddress: string;
  model: string;
  deviceType: BandDeviceType;
  firmwareVersion: string;
  batteryLevel: number;
  isWorn: boolean;
  rssi: number;
  status: BandStatus;
  lastSeenAt: string | null;
  notes?: string;
  assignedResidentId: number | null;
  assignedResident?: Resident | null;
  createdAt: string;
  updatedAt: string;
}

export interface BandCounters {
  total: number;
  active: number;
  available: number;
  charging: number;
  maintenance: number;
  lowBattery: number;
  notWorn: number;
}

// ==========================================
// Fall Incident & Emergency Dispatch Types
// ==========================================

export type FallSeverity = 'moderate' | 'severe' | 'critical';
export type FallIncidentStatus =
  | 'unresolved'
  | 'emergency_dispatched'
  | 'resolved_false_alarm'
  | 'resolved_assisted';

export interface FallIncident {
  id: number;
  residentId: number;
  bandId: number | null;
  impactForceG: number;
  orientationChangeDeg: number;
  motionlessDurationSeconds: number;
  severity: FallSeverity;
  status: FallIncidentStatus;
  location: string;
  clinicalDescription?: string;
  detectedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  resident?: Resident;
  band?: Band | null;
  createdAt: string;
  updatedAt: string;
}

export interface FallCounters {
  total: number;
  unresolved: number;
  emergencyDispatched: number;
  resolvedFalseAlarm: number;
  resolvedAssisted: number;
}


