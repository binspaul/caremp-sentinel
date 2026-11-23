import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Floor } from './floor.entity';
import { Beacon } from './beacon.entity';
import { Resident } from '../../residents/entities/resident.entity';

export type ZoneType =
  | 'suite'
  | 'corridor'
  | 'common'
  | 'dining'
  | 'garden'
  | 'staff'
  | 'therapy'
  | 'calming'
  | 'restricted';

@Entity('room_zone')
export class RoomZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  floorId: number;

  @ManyToOne(() => Floor, (floor) => floor.zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'floorId' })
  floor: Floor;

  @Column({ type: 'varchar', length: 50 })
  roomNumber: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'suite' })
  zoneType: ZoneType;

  @Column({ type: 'boolean', default: true })
  isSafePerimeter: boolean;

  @Column({ type: 'int', default: 0 })
  x: number;

  @Column({ type: 'int', default: 0 })
  y: number;

  @Column({ type: 'int', default: 100 })
  width: number;

  @Column({ type: 'int', default: 100 })
  height: number;

  @Column({ type: 'int', nullable: true })
  currentResidentId: number | null;

  @ManyToOne(() => Resident, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currentResidentId' })
  currentResident: Resident | null;

  @Column({ type: 'int', default: 1 })
  maxCapacity: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @OneToMany(() => Beacon, (beacon) => beacon.zone, { cascade: true })
  beacons: Beacon[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
