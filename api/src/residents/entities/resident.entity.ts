import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Vital } from 'src/vitals/entities/vital.entity';

export enum SleepStatus {
  UNKNOWN = 0,
  AWAKE = 1,
  LIGHT_SLEEP = 2,
  DEEP_SLEEP = 3,
}

export enum TemperatureUnit {
  FAHRENHEIT = 1,
  CELSIUS = 2,
}

export enum HeightUnit {
  CM = 1,
  FEET = 2,
}

export enum WeightUnit {
  KG = 1,
  LBS = 2,
}

@Entity('resident')
export class Resident {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  uhid: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: '' })
  middleName: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  description: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  emailAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondaryEmailAddress: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondaryPhoneNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'integer', nullable: true, default: 0 })
  age: number;

  @Column({ type: 'integer', nullable: true })
  gender: number;

  @Column({ type: 'integer', nullable: true })
  bloodGroupId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  emergencyContactNumber: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  address: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  notes: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  specialNotes: string;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  avatar: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  avatarKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  avatarThumbnailKey: string;

  @Column({ type: 'integer', nullable: false, default: 1 })
  status: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: false,
    default: 75.0,
  })
  referenceHeartRate: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 20,
  })
  heartRateTolerance: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    default: 40.0,
  })
  referenceHrv: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 15.0,
  })
  hrvTolerance: number;

  @Column({ type: 'integer', nullable: false, default: 120 })
  referenceSystolicBP: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 20,
  })
  systolicBPTolerance: number;

  @Column({ type: 'integer', nullable: false, default: 80 })
  referenceDiastolicBP: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 15,
  })
  diastolicBPTolerance: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: false,
    default: 98.0,
  })
  referenceOxygenSaturation: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 5,
  })
  oxygenSaturationTolerance: number;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: false,
    default: 36.8,
  })
  referenceBodyTemperature: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 1.5,
  })
  temperatureToleranceCelsius: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 3.0,
  })
  temperatureToleranceFahrenheit: number;

  @Column({ type: 'int', nullable: true, default: TemperatureUnit.CELSIUS })
  referenceTemperatureUnit: TemperatureUnit;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: number;

  @Column({ type: 'int', default: 1 })
  heightUnit: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weight: number | null;

  @Column({ type: 'int', nullable: true, default: WeightUnit.KG })
  weightUnit: WeightUnit;

  @Column({ type: 'int', default: SleepStatus.UNKNOWN })
  referenceSleepStatus: SleepStatus;

  @Column({ type: 'integer', nullable: false, default: 0 })
  referenceStepCount: number;

  @Column({ type: 'integer', nullable: true, default: 60 })
  referenceDeepSleep: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 25,
  })
  referenceDeepSleepTolerance: number;

  @Column({ type: 'integer', nullable: true, default: 260 })
  referenceLightSleep: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 15,
  })
  referenceLightSleepTolerance: number;

  @Column({ type: 'integer', nullable: true, default: 90 })
  referenceRemSleep: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 20,
  })
  referenceRemSleepTolerance: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  createdBy: number;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  updatedBy: number;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @Column({ type: 'integer', nullable: true })
  deletedBy: number;

  @Index()
  @Column({ type: 'integer', nullable: true, default: null })
  userId: number | null;

  // Relations
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Vital, (vital) => vital.resident)
  vitals: Vital[];
}
