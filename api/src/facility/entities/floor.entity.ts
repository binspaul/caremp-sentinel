import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoomZone } from './room-zone.entity';

@Entity('facility_floor')
export class Floor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  floorNumber: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'FL-01' })
  code: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'int', default: 1000 })
  layoutWidth: number;

  @Column({ type: 'int', default: 600 })
  layoutHeight: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => RoomZone, (zone) => zone.floor, { cascade: true })
  zones: RoomZone[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
