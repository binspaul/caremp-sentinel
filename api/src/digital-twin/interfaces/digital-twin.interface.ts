import { Baseline } from "./baseline.interface";
import { CorrelationResult } from "./correlation-result.interface";
import { HealthRecord } from "./health-record.interface";
import { Prediction } from "./prediction.interface";
import { Recommendation } from "./recommendation.interface";
import { SleepSummary } from "./sleep-summary.interface";
import { TrendResult } from "./trend-result.interface";
import { Vital } from "./vital-interface";

export interface IDigitalTwin {
    residentId: number,
    identity: {
        firstName: string;
        lastName: string;
        age: number;
        gender: string;
    };
    body: {
        heightCm: number;
        weightKg: number;
        bmi?: number;
        bloodGroup?: string;
    };
    physiology: {
        heartRate?: Vital;
        hrv?: Vital;
        spo2?: Vital;
        systolicBP?: Vital;
        diastolicBP?: Vital;
        bodyTemperature?: Vital;
        steps?: Vital;
        sleep?: SleepSummary;
    };
    baselines: {
        heartRate?: Baseline;
        hrv?: Baseline;
        spo2?: Baseline;
        systolicBP?: Baseline;
        diastolicBP?: Baseline;
        bodyTemperature?: Baseline;
        sleep?: {
            totalDuration?: Baseline;
            deep?: Baseline;
            light?: Baseline;
            rem?: Baseline;
        };
    };
    trends: TrendResult[];
    correlations: CorrelationResult[];
    healthInsights: {
        sundowning?: any;
        wandering?: any;
        circadian?: any;
        deterioration?: any;
        predictions?: Prediction[];
        recommendations?: Recommendation[];
        [key: string]: any;
    };
    healthRecords: HealthRecord[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        twinVersion: number;
    };
}