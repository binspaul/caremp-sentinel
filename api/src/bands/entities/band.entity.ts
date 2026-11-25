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

export enum BandStatus {
  AVAILABLE = 'available',
  ACTIVE = 'active',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance',
}

@Entity('band')
export class Band {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  serialNumber: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false })
  macAddress: string;

  @Column({ type: 'varchar', length: 255, default: 'Sentinel Bio-Band Pulse v2' })
  model: string;

  @Column({ type: 'varchar', length: 50, default: 'v1.2.0' })
  firmwareVersion: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  batteryLevel: number;

  @Column({ type: 'boolean', default: true })
  isWorn: boolean;

  @Column({ type: 'integer', default: -65 })
  rssi: number; // dBm BLE signal strength

  @Column({ type: 'varchar', length: 50, default: BandStatus.AVAILABLE })
  status: BandStatus;

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
