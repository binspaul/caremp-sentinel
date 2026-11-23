import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoomZone } from './room-zone.entity';

export type BeaconStatus = 'active' | 'low_battery' | 'offline' | 'maintenance';

@Entity('beacon')
export class Beacon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  zoneId: number | null;

  @ManyToOne(() => RoomZone, (zone) => zone.beacons, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'zoneId' })
  zone: RoomZone | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  serialNumber: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  macAddress: string;

  @Column({ type: 'varchar', length: 100, default: 'Sentinel BLE Anchor v2' })
  model: string;

  @Column({ type: 'int', default: 1000 })
  major: number;

  @Column({ type: 'int', default: 2000 })
  minor: number;

  @Column({ type: 'int', default: -59 })
  rssiCalibrated1m: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 98.5 })
  batteryLevel: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: BeaconStatus;

  @Column({ type: 'int', default: 5 })
  txIntervalHz: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastHeartbeatAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
