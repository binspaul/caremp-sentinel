import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resident } from '../../residents/entities/resident.entity';

export enum ChestPatchType {
  SINGLE_LEAD_ECG = 'single_lead_ecg',
  CARDIOPULMONARY = 'cardiopulmonary',
  TEMP_RESPIRATION = 'temp_respiration',
}

export enum AdhesionStatus {
  ADHERED = 'adhered',
  LOOSE = 'loose',
  DETACHED = 'detached',
  REPLACEMENT_DUE = 'replacement_due',
}

export enum ChestPatchStatus {
  ACTIVE = 'active',
  AVAILABLE = 'available',
  CHARGING = 'charging',
  DEPLETED = 'depleted',
  MAINTENANCE = 'maintenance',
}

@Entity('chest_patch')
export class ChestPatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  serialNumber: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  macAddress: string;

  @Column({ type: 'varchar', length: 255, default: 'Sentinel Bio-Patch Hydrogel ECG v3' })
  model: string;

  @Column({ type: 'varchar', length: 50, default: ChestPatchType.SINGLE_LEAD_ECG })
  patchType: ChestPatchType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  batteryLevel: number;

  @Column({ type: 'varchar', length: 50, default: AdhesionStatus.ADHERED })
  adhesionStatus: AdhesionStatus;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 1.0 })
  wearDurationDays: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 7.0 })
  maxWearDays: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  skinTempCelsius: number | null;

  @Column({ type: 'boolean', default: true })
  isWorn: boolean;

  @Column({ type: 'integer', default: -62 })
  rssi: number; // dBm BLE signal strength

  @Column({ type: 'varchar', length: 50, default: ChestPatchStatus.AVAILABLE })
  status: ChestPatchStatus;

  @Column({ type: 'varchar', length: 50, default: 'v3.0.2' })
  firmwareVersion: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @Column({ type: 'varchar', length: 2000, nullable: true, default: '' })
  notes: string;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Index()
  @Column({ type: 'integer', nullable: true, default: null })
  assignedResidentId: number | null;

  @ManyToOne(() => Resident, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedResidentId' })
  assignedResident: Resident | null;
}
