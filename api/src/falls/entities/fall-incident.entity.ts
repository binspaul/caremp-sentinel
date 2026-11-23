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
import { Band } from '../../bands/entities/band.entity';

export enum FallSeverity {
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum FallIncidentStatus {
  UNRESOLVED = 'unresolved',
  EMERGENCY_DISPATCHED = 'emergency_dispatched',
  RESOLVED_FALSE_ALARM = 'resolved_false_alarm',
  RESOLVED_ASSISTED = 'resolved_assisted',
}

@Entity('fall_incident')
export class FallIncident {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'integer', nullable: false })
  residentId: number;

  @Index()
  @Column({ type: 'integer', nullable: true, default: null })
  bandId: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 3.4,
  })
  impactForceG: number; // e.g. 3.4g impact force

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 1,
    default: 88.0,
  })
  orientationChangeDeg: number; // e.g. 88 degrees (from upright to horizontal)

  @Column({
    type: 'integer',
    default: 45,
  })
  motionlessDurationSeconds: number; // Post-fall immobility window in seconds

  @Column({
    type: 'varchar',
    length: 50,
    default: FallSeverity.CRITICAL,
  })
  severity: FallSeverity;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    default: FallIncidentStatus.UNRESOLVED,
  })
  status: FallIncidentStatus;

  @Column({
    type: 'varchar',
    length: 255,
    default: 'Bedroom Bedside',
  })
  location: string;

  @Column({
    type: 'varchar',
    length: 2000,
    nullable: true,
    default: 'Rapid kinematic deceleration followed by loss of thoracic micro-motion.',
  })
  clinicalDescription: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  detectedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolvedBy: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  resolutionNotes: string | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Resident, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @ManyToOne(() => Band, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bandId' })
  band: Band | null;
}
