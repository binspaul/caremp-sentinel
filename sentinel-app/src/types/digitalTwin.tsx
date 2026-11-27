export interface ResidentDigitalTwinData {
  id: number;
  aiSummary: string;
  residentId: number;
  identity: Identity;
  body: BodyMetrics;
  physiology: Physiology;
  baselines: Baselines;
  trends: Trend[];
  correlations: Correlation[];
  healthInsights: HealthInsights;
  healthRecords: HealthRecord[];
  metadata: Record<string, unknown>;
}

export interface Identity {
  age: number;
  gender: string;
  lastName: string;
  firstName: string;
}

export interface BodyMetrics {
  bmi: number;
  heightCm: number;
  weightKg: number;
  bloodGroup: string;
}

export interface Physiology {
  hrv: VitalReading;
  heartRate: VitalReading;
  systolicBP: VitalReading;
  diastolicBP: VitalReading;
  bodyTemperature: VitalReading;
}

export interface BaselineValue {
  value: number;
  updatedAt: string;
}

export interface Baselines {
  bodyTemperature: BaselineValue;
  diastolicBP: BaselineValue;
  heartRate: BaselineValue;
  hrv: BaselineValue;
  sleep: Record<string, unknown>;
  spo2: BaselineValue;
  systolicBP: BaselineValue;
}

export interface VitalReading {
  unit: string;
  value: number;
  timestamp: string;
}

export interface HealthInsights {
  predictions: Prediction[];
  healthyAgeing: HealthyAgeing;
  recommendations: Recommendation[];
  sundowning: Sundowning;
  wandering: Wandering;
}

export interface HealthyAgeing {
  score: number;
  category: string;
  triggeredRules: string[];
}

type TrendDirection = "INCREASING" | "DECREASING" | "STABLE";

type Vital =
  | "heartRate"
  | "hrv"
  | "spo2"
  | "systolicBP"
  | "diastolicBP"
  | "bodyTemperature";

export interface Trend {
  vital: Vital;
  window: string;
  direction: TrendDirection;
  rateOfChange: number;
  percentageChange: number;
}

type VitalPair =
  | "heartRate-spo2"
  | "heartRate-hrv"
  | "systolicBP-diastolicBP"
  | "hrv-bodyTemperature";

export interface Correlation {
  strength: "WEAK" | "MODERATE" | "STRONG";
  direction: "POSITIVE" | "NEGATIVE";
  vitalPair: VitalPair;
  coefficient: number;
}

export interface Prediction {
  [key: string]: unknown;
}

export interface Recommendation {
  [key: string]: unknown;
}

export interface HealthRecord {
  [key: string]: unknown;
}

export interface Sundowning {
  status: "CALM" | "RESTLESS" | "SUNDOWNING_SURGE";
  severity: string;
  agitationIndex: number;
  isSundowningWindow: boolean;
  advanceNoticeMinutes: number | null;
  contributingFactors: string[];
  recommendedInterventions: string[];
}

export interface Wandering {
  actionAlert: string | null;
  contributingFactors: string[];
  currentLocation: string;
  elopementRisk: "LOW" | "ELEVATED" | "CRITICAL";
  isSafeZone: boolean;
  minutesOutOfBed: number;
  nightBedExit: boolean;
  pacingLoopCount: number;
  riskScore: number;
  wanderingStatus:
    | "SAFE_IN_ROOM"
    | "HALLWAY_PACING"
    | "NOCTURNAL_BED_EXIT"
    | "PERIMETER_ALERT";
}
