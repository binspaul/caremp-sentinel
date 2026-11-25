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
  notes?: string;
  specialNotes?: string;
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
  fallRiskScore?: number;
  healthScore?: number;
  hasFallHistory?: boolean;
  roomNumber?: string;
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

export interface Band {
  id: number;
  serialNumber: string;
  macAddress: string;
  model: string;
  deviceType?: string;
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
// Radar Pods Hardware Fleet Types
// ==========================================

export type RadarInstallationType = 'bedhead' | 'wall_mount' | 'ceiling';
export type RadarPodStatus = 'active' | 'standby' | 'offline' | 'maintenance';

export interface RadarPod {
  id: number;
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
  isOnline: boolean;
  roomNumber: string | null;
  lastHeartbeatAt: string | null;
  notes?: string;
  assignedResidentId: number | null;
  assignedResident?: Resident | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RadarPodCounters {
  total: number;
  active: number;
  standby: number;
  offline: number;
  maintenance: number;
  bedOccupied: number;
}

// ==========================================
// Chest Patches Hardware Fleet Types
// ==========================================

export type ChestPatchType = 'single_lead_ecg' | 'cardiopulmonary' | 'temp_respiration';
export type AdhesionStatus = 'adhered' | 'loose' | 'detached' | 'replacement_due';
export type ChestPatchStatus = 'active' | 'available' | 'charging' | 'depleted' | 'maintenance';

export interface ChestPatch {
  id: number;
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
  lastSeenAt: string | null;
  notes?: string;
  assignedResidentId: number | null;
  assignedResident?: Resident | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChestPatchCounters {
  total: number;
  active: number;
  available: number;
  charging: number;
  depleted: number;
  maintenance: number;
  lowBattery: number;
  looseAdhesion: number;
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

// ==========================================
// Facility Indoor Map & Beacon Micro-Location Types
// ==========================================

export type FacilityZoneType =
  | 'suite'
  | 'corridor'
  | 'common'
  | 'dining'
  | 'garden'
  | 'staff'
  | 'therapy'
  | 'calming'
  | 'restricted';

export interface BeaconInfo {
  id: number;
  serialNumber: string;
  macAddress?: string;
  batteryLevel: number;
  status: string;
  txIntervalHz?: number;
  rssiCalibrated1m?: number;
}

export type BeaconStatus = 'active' | 'low_battery' | 'offline' | 'maintenance';

export interface Beacon {
  id: number;
  serialNumber: string;
  macAddress: string;
  model: string;
  zoneId?: number | null;
  zone?: {
    id: number;
    roomNumber: string;
    name: string;
    floor?: { id?: number; floorNumber: number; name: string };
  } | null;
  major?: number;
  minor?: number;
  rssiCalibrated1m?: number;
  batteryLevel: number;
  status: BeaconStatus;
  txIntervalHz?: number;
  lastHeartbeatAt?: string;
  createdAt?: string;
}

export interface BeaconCounters {
  total: number;
  active: number;
  lowBattery: number;
  unassigned: number;
}

export interface RoomZone {
  id: number;
  floorId: number;
  floor?: Partial<Floor>;
  roomNumber: string;
  name: string;
  zoneType: FacilityZoneType;
  isSafePerimeter: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  maxCapacity?: number;
  description?: string;
  currentResident?: Resident | null;
  beacons?: BeaconInfo[];
}

export interface Floor {
  id: number;
  floorNumber: number;
  name: string;
  code: string;
  description?: string;
  layoutWidth: number;
  layoutHeight: number;
  isActive: boolean;
  zones: RoomZone[];
}

export interface ResidentPresence {
  residentId: number;
  uhid: string;
  name: string;
  age: number;
  floorNumber: number;
  floorName: string;
  zoneId: number;
  roomNumber: string;
  zoneName: string;
  zoneType: FacilityZoneType;
  isSafePerimeter: boolean;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  beaconId: string;
  rssi: number;
  dwellMinutes: number;
  status: 'safe' | 'egress_alert';
}

export interface FacilityGeoFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: any;
  };
  properties: {
    indoor: 'room' | 'corridor' | 'beacon' | 'area';
    level: number;
    floorId?: number;
    floorName?: string;
    zoneId?: number;
    ref?: string;
    name?: string;
    zoneType?: FacilityZoneType;
    isSafePerimeter?: boolean;
    maxCapacity?: number;
    centerLat?: number;
    centerLng?: number;
    currentResident?: { id: number; name: string; uhid: string } | null;
    beaconsCount?: number;
    beaconId?: number;
    serialNumber?: string;
    macAddress?: string;
    batteryLevel?: number;
    roomNumber?: string;
    zoneName?: string;
    lat?: number;
    lng?: number;
  };
}

export interface FacilityGeoJson {
  type: 'FeatureCollection';
  metadata: {
    facility: string;
    anchor: {
      lat: number;
      lng: number;
      widthMeters: number;
      heightMeters: number;
    };
    activeLevel: number | null;
    featureCount: number;
    generatedAt: string;
  };
  features: FacilityGeoFeature[];
}

// ==========================================
// Digital Twin & Memory Care Types
// ==========================================

export interface SundowningInsight {
  agitationIndex?: number;
  riskLevel?: string;
  stage?: string;
  patternSummary?: string;
  confidence?: number;
  recommendations?: string[];
  [key: string]: any;
}

export interface WanderingInsight {
  riskLevel?: string;
  dwellMinutes?: number;
  currentZone?: string;
  zoneType?: string;
  isSafePerimeter?: boolean;
  pattern?: string;
  recommendations?: string[];
  [key: string]: any;
}

export interface CircadianInsight {
  regularityScore?: number;
  dayNightInversion?: boolean;
  dayNightStatus?: string;
  fragmentationIndex?: number;
  recommendations?: string[];
  [key: string]: any;
}

export interface DeteriorationInsight {
  compositeScore?: number;
  alertStatus?: string;
  contributors?: string[];
  [key: string]: any;
}

export interface DementiaHealthInsights {
  sundowning?: SundowningInsight;
  wandering?: WanderingInsight;
  circadian?: CircadianInsight;
  deterioration?: DeteriorationInsight;
  [key: string]: any;
}

export interface AISummary {
  headline?: string;
  summary?: string;
  focus_areas?: string[];
  recommendations?: string[];
  generated_at?: string;
  [key: string]: any;
}

export interface VitalTrend {
  vital: string;
  window: string;
  direction: string;
  rateOfChange: number;
  percentageChange: number;
}

export interface VitalCorrelation {
  vitalPair: string;
  coefficient: number;
  strength: string;
  direction: string;
}

export interface DigitalTwin {
  id: number;
  residentId: number;
  physiology?: any;
  vitalsSummary?: any;
  baselines?: any;
  trends?: VitalTrend[];
  correlations?: VitalCorrelation[];
  healthInsights?: DementiaHealthInsights;
  aiSummary?: string | AISummary;
  lastEngineRun?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Notification Types
// ==========================================

export interface Notification {
  id: number;
  userId?: number | null;
  residentId?: number | null;
  type: 'alert' | 'fall' | 'vital_breach' | 'geofence' | 'device' | 'system' | string;
  priority: 'critical' | 'high' | 'medium' | 'low' | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  isDismissed: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCounters {
  total: number;
  unread: number;
  criticalUnread: number;
  byType: Record<string, number>;
}




