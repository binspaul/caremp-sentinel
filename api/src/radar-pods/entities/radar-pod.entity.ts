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

export enum RadarInstallationType {
  BEDHEAD = 'bedhead',
  WALL_MOUNT = 'wall_mount',
  CEILING = 'ceiling',
}

export enum RadarPodStatus {
  ACTIVE = 'active',
  STANDBY = 'standby',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

@Entity('radar_pod')
export class RadarPod {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  serialNumber: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  macAddress: string;

  @Column({ type: 'varchar', length: 255, default: 'Sentinel 60GHz FMCW Radar Pod v2' })
  model: string;

  @Column({ type: 'varchar', length: 50, default: '60 GHz FMCW' })
  frequencyBand: string;

  @Column({ type: 'varchar', length: 50, default: RadarInstallationType.BEDHEAD })
  installationType: RadarInstallationType;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 5.0 })
  detectionRangeMeters: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  respirationRateBpm: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  heartRateBpm: number | null;

  @Column({ type: 'boolean', default: false })
  bedOccupancy: boolean;

  @Column({ type: 'varchar', length: 50, default: 'v2.1.0' })
  firmwareVersion: string;

  @Column({ type: 'varchar', length: 100, default: 'ac_line_battery_backup' })
  powerSource: string;

  @Column({ type: 'varchar', length: 50, default: RadarPodStatus.STANDBY })
  status: RadarPodStatus;

  @Column({ type: 'boolean', default: true })
  isOnline: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roomNumber: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastHeartbeatAt: Date | null;

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
