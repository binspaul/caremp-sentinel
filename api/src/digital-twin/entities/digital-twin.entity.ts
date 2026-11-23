import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { IDigitalTwin } from '../interfaces/digital-twin.interface';
import { Baseline } from '../interfaces/baseline.interface';
import { CorrelationResult } from '../interfaces/correlation-result.interface';
import { HealthRecord } from '../interfaces/health-record.interface';
import { Prediction } from '../interfaces/prediction.interface';
import { Recommendation } from '../interfaces/recommendation.interface';
import { SleepSummary } from '../interfaces/sleep-summary.interface';
import { TrendResult } from '../interfaces/trend-result.interface';
import { Vital } from '../interfaces/vital-interface';

import { Resident } from 'src/residents/entities/resident.entity';

@Entity('digital_twin')
export class DigitalTwin implements IDigitalTwin {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', default: null })
    aiSummary: string;

    @Index()
    @Column({ type: 'int', nullable: false })
    residentId: number;

    @Column({ type: 'jsonb' })
    identity: {
        firstName: string;
        lastName: string;
        age: number;
        gender: string;
    };

    @Column({ type: 'jsonb' })
    body: {
        heightCm: number;
        weightKg: number;
        bmi?: number;
        bloodGroup?: string;
    };

    @Column({ type: 'jsonb' })
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

    @Column({ type: 'jsonb' })
    baselines: {
        heartRate?: Baseline;
        hrv?: Baseline;
        spo2?: Baseline;
        systolicBP?: Baseline;
        diastolicBP?: Baseline;
        bodyTemperature?: Baseline;
        sleep?: {
            deep?: Baseline;
            light?: Baseline;
            rem?: Baseline;
            totalDuration?: Baseline;
        };
    };

    @Column({ type: 'jsonb' })
    trends: TrendResult[];

    @Column({ type: 'jsonb' })
    correlations: CorrelationResult[];

    @Column({ type: 'jsonb' })
    healthInsights: {
        healthyAgeing: {
            score: number;
            category: 'GOOD' | 'WATCH' | 'CONCERN';
            triggeredRules: string[];
        };
        predictions: Prediction[];
        recommendations: Recommendation[];
    };

    @Column({ type: 'jsonb' })
    healthRecords: HealthRecord[];

    @Column({ type: 'jsonb' })
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        twinVersion: number;
    };

    // Relations
    @ManyToOne(() => Resident, { nullable: false })
    @JoinColumn({ name: 'residentId' })
    resident: Resident;
}