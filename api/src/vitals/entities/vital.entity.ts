import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Resident } from 'src/residents/entities/resident.entity';

export enum Status {
  UNKNOWN = 0,
  NEW = 1,
  PROCESSING = 2,
  PROCESSED = 3,
  FAILED = 4,
  EXPIRED = 5,
}

export enum SleepStatus {
  UNKNOWN = 0,
  AWAKE = 1,
  LIGHT_SLEEP = 2,
  DEEP_SLEEP = 3,
}

export enum SleepComputationState {
  UNKNOWN = 0,
  PARTIAL = 1,
  FINAL = 2,
  INVALID = 3,
}

export enum TemperatureUnit {
  UNKNOWN = 0,
  FAHRENHEIT = 1,
  CELSIUS = 2,
}

export enum Priority {
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

@Index(['residentId', 'generatedAt'])
@Entity('vital')
export class Vital {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  heartRate: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  hrv: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  systolicBP: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  diastolicBP: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  oxygenSaturation: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  bodyTemperature: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 0.0,
  })
  skinTemperature: number;

  @Column({ type: 'int', nullable: true, default: TemperatureUnit.CELSIUS })
  temperatureUnit: TemperatureUnit;

  @Column({ type: 'decimal', nullable: true, default: 0 })
  rssi: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  deepSleepTime: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  lightSleepTime: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  remSleepTime: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  awakeSleepTime: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  totalSleepTime: number;

  @Column({ type: 'int', default: SleepStatus.UNKNOWN })
  sleepStatus: SleepStatus;

  @Column({ type: 'int', default: SleepComputationState.UNKNOWN })
  sleepComputationState: SleepComputationState;

  @Column({ type: 'boolean', default: false })
  sleepValueStable: boolean;

  @Column({ type: 'boolean', default: false })
  wearingIndicator: boolean;

  @Column({ type: 'boolean', nullable: true, default: false })
  movementDetected: boolean;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  batteryLevel: number;

  @Column({ type: 'jsonb', nullable: false, default: () => "'{}'" })
  payload: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @Column({ type: 'integer', nullable: true })
  deletedBy: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date | null;

  @Column({ type: 'integer', nullable: true, default: null })
  createdBy: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'integer', nullable: true, default: null })
  updatedBy: number;

  @Column({ type: 'integer', nullable: false })
  residentId: number;

  // Relations
  @ManyToOne(() => Resident, (resident) => resident.vitals, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;
}
