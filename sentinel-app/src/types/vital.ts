export interface VitalRecord {
  id: number;
  generatedAt: string;
  heartRate: string;
  hrv: string;
  systolicBP: string;
  diastolicBP: string;
  oxygenSaturation: string;
  bodyTemperature: string;
  skinTemperature: string;
  temperatureUnit: number;
  rssi?: string;
  deepSleepTime?: string;
  lightSleepTime?: string;
  remSleepTime?: string;
  awakeSleepTime?: string;
  totalSleepTime?: string;
  sleepStatus?: number;
  sleepComputationState?: number;
  sleepValueStable?: boolean;
  wearingIndicator?: boolean;
  movementDetected?: boolean;
  batteryLevel?: string;
  payload?: {
    source?: string;
  };
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
  residentId?: number;
}